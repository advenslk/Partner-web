import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb, withTransaction } from '../db/database.ts';
import {
  type AuthedRequest,
  clearSessionCookie,
  generateRandomToken,
  getClientIp,
  hashToken,
  rateLimit,
  requireAuth,
  setSessionCookie,
  verifyCsrf,
  writeAuditLog,
} from '../middleware/security.ts';
import { renderTemplate, sendBrandedEmail } from '../services/email.ts';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(2).max(180).optional(),
  organizationType: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().min(2).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function createSessionForUser(userId: string, req: AuthedRequest) {
  const db = getDb();
  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const csrfToken = generateRandomToken(24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `
    INSERT INTO sessions (id, user_id, token_hash, csrf_token, user_agent, ip_address, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    crypto.randomUUID(),
    userId,
    tokenHash,
    csrfToken,
    String(req.headers['user-agent'] || '').slice(0, 250),
    getClientIp(req),
    expiresAt
  );

  return { rawToken, csrfToken };
}

router.get('/me', (req: AuthedRequest, res) => {
  if (!req.authUser) {
    res.json({ authenticated: false, user: null });
    return;
  }

  const db = getDb();
  const profile = db
    .prepare(
      `
      SELECT id, email, full_name, role, email_verified, status,
             notification_email, notification_status_updates, notification_messages, created_at
      FROM users WHERE id = ?
    `
    )
    .get(req.authUser.id) as Record<string, unknown> | undefined;

  if (!profile) {
    res.json({ authenticated: false, user: null });
    return;
  }

  res.json({
    authenticated: true,
    csrfToken: req.authUser.csrfToken,
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      emailVerified: Boolean(profile.email_verified),
      status: profile.status,
      notifications: {
        email: Boolean(profile.notification_email),
        statusUpdates: Boolean(profile.notification_status_updates),
        messages: Boolean(profile.notification_messages),
      },
      createdAt: profile.created_at,
    },
  });
});

router.post('/register', rateLimit(15, 15 * 60 * 1000), async (req: AuthedRequest, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid registration details.', details: parsed.error.flatten() });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const verifyToken = generateRandomToken(16);
  const verifyTokenHash = hashToken(verifyToken);
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  withTransaction(() => {
    db.prepare(
      `
      INSERT INTO users (id, email, password_hash, full_name, role, email_verified, verification_token_hash, verification_expires_at)
      VALUES (?, ?, ?, ?, 'PARTNER', 0, ?, ?)
    `
    ).run(userId, email, passwordHash, parsed.data.fullName, verifyTokenHash, verifyExpires);

    if (parsed.data.organizationName) {
      const orgId = crypto.randomUUID();
      db.prepare(
        `
        INSERT INTO organizations (id, owner_user_id, name, organization_type, country, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      ).run(
        orgId,
        userId,
        parsed.data.organizationName,
        parsed.data.organizationType || 'Technology Company',
        parsed.data.country || 'International',
        'Organization registered via HelzerX Partner Portal.'
      );
      db.prepare(
        `INSERT INTO organization_members (id, organization_id, user_id, member_role) VALUES (?, ?, ?, 'OWNER')`
      ).run(crypto.randomUUID(), orgId, userId);
    }

    // Link any previously submitted applications with matching email
    db.prepare(
      `UPDATE partner_applications SET applicant_user_id = ? WHERE lower(contact_email) = ? AND applicant_user_id IS NULL`
    ).run(userId, email);

    const legalDocs = db
      .prepare(`SELECT key, version FROM legal_documents WHERE key IN ('legal_privacy', 'legal_terms')`)
      .all() as Array<{ key: string; version: string }>;
    const acceptStmt = db.prepare(
      `
      INSERT INTO legal_acceptances (id, user_id, user_email, organization_name, document_key, document_version, context, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, 'ACCOUNT_REGISTRATION', ?, ?)
    `
    );
    const clientIp = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 250);
    for (const ld of legalDocs) {
      acceptStmt.run(
        crypto.randomUUID(),
        userId,
        email,
        parsed.data.organizationName || null,
        ld.key,
        ld.version,
        clientIp,
        userAgent
      );
    }
  });

  const { rawToken, csrfToken } = createSessionForUser(userId, req);
  setSessionCookie(req, res, rawToken);

  const rendered = renderTemplate('account_registration', {
    name: parsed.data.fullName,
    token: verifyToken,
  });
  if (rendered) {
    await sendBrandedEmail({
      to: email,
      templateKey: 'account_registration',
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
    });
  }

  writeAuditLog({
    actorUserId: userId,
    actorEmail: email,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: userId,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({
    message: 'Account created. Please check your email for your verification token.',
    csrfToken,
    verificationPreviewHint: process.env.SMTP_HOST ? undefined : verifyToken,
  });
});

router.post('/login', rateLimit(20, 15 * 60 * 1000), async (req: AuthedRequest, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide a valid email and password.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const user = db
    .prepare('SELECT id, email, password_hash, full_name, role, status FROM users WHERE email = ?')
    .get(email) as
    | {
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: string;
        status: string;
      }
    | undefined;

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'This account is currently suspended. Contact HelzerX administration.' });
    return;
  }

  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(user.id);
  const { rawToken, csrfToken } = createSessionForUser(user.id, req);
  setSessionCookie(req, res, rawToken);

  writeAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    action: 'USER_LOGIN',
    entityType: 'user',
    entityId: user.id,
    ipAddress: getClientIp(req),
  });

  res.json({
    message: 'Signed in successfully.',
    csrfToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  });
});

router.post('/logout', requireAuth, verifyCsrf, (req: AuthedRequest, res) => {
  const db = getDb();
  if (req.authUser) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.authUser.sessionId);
    writeAuditLog({
      actorUserId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'USER_LOGOUT',
      entityType: 'session',
      entityId: req.authUser.sessionId,
      ipAddress: getClientIp(req),
    });
  }
  clearSessionCookie(req, res);
  res.json({ message: 'Signed out successfully.' });
});

router.post('/verify-email', rateLimit(15, 15 * 60 * 1000), (req: AuthedRequest, res) => {
  const token = String(req.body?.token || '').trim();
  const email = String(req.body?.email || req.authUser?.email || '').trim().toLowerCase();
  if (!token || !email) {
    res.status(400).json({ error: 'Email and verification token are required.' });
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  const user = db
    .prepare(
      `SELECT id, verification_expires_at FROM users WHERE email = ? AND verification_token_hash = ?`
    )
    .get(email, tokenHash) as { id: string; verification_expires_at: string } | undefined;

  if (!user || new Date(user.verification_expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Verification token is invalid or expired.' });
    return;
  }

  db.prepare(
    `UPDATE users SET email_verified = 1, verification_token_hash = NULL, verification_expires_at = NULL, updated_at = datetime('now') WHERE id = ?`
  ).run(user.id);

  writeAuditLog({
    actorUserId: user.id,
    actorEmail: email,
    action: 'EMAIL_VERIFIED',
    entityType: 'user',
    entityId: user.id,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Email verified successfully.' });
});

router.post('/resend-verification', requireAuth, verifyCsrf, rateLimit(5, 15 * 60 * 1000), async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  const verifyToken = generateRandomToken(16);
  const verifyHash = hashToken(verifyToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `UPDATE users SET verification_token_hash = ?, verification_expires_at = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(verifyHash, expires, req.authUser.id);

  const rendered = renderTemplate('account_registration', {
    name: req.authUser.fullName,
    token: verifyToken,
  });
  if (rendered) {
    await sendBrandedEmail({
      to: req.authUser.email,
      templateKey: 'account_registration',
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
    });
  }

  res.json({
    message: 'Verification email dispatched.',
    verificationPreviewHint: process.env.SMTP_HOST ? undefined : verifyToken,
  });
});

router.post('/forgot-password', rateLimit(10, 15 * 60 * 1000), async (req: AuthedRequest, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(email) as
    | { id: string; full_name: string }
    | undefined;

  let previewHint: string | undefined;
  if (user) {
    const resetToken = generateRandomToken(16);
    const resetHash = hashToken(resetToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare(
      `UPDATE users SET reset_token_hash = ?, reset_expires_at = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(resetHash, expires, user.id);

    const rendered = renderTemplate('password_reset', { token: resetToken });
    if (rendered) {
      await sendBrandedEmail({
        to: email,
        templateKey: 'password_reset',
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
      });
    }
    if (!process.env.SMTP_HOST) {
      previewHint = resetToken;
    }
  }

  res.json({
    message: 'If an account matches that email, password reset instructions have been issued.',
    resetPreviewHint: previewHint,
  });
});

router.post('/reset-password', rateLimit(10, 15 * 60 * 1000), async (req: AuthedRequest, res) => {
  const schema = z.object({
    email: z.string().trim().email(),
    token: z.string().trim().min(6),
    newPassword: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email, reset token, and new password (8+ chars) are required.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const tokenHash = hashToken(parsed.data.token);
  const user = db
    .prepare(
      `SELECT id, reset_expires_at FROM users WHERE email = ? AND reset_token_hash = ?`
    )
    .get(email, tokenHash) as { id: string; reset_expires_at: string } | undefined;

  if (!user || new Date(user.reset_expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Password reset token is invalid or expired.' });
    return;
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  withTransaction(() => {
    db.prepare(
      `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_expires_at = NULL, updated_at = datetime('now') WHERE id = ?`
    ).run(newHash, user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  });

  writeAuditLog({
    actorUserId: user.id,
    actorEmail: email,
    action: 'PASSWORD_RESET',
    entityType: 'user',
    entityId: user.id,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Password updated successfully. Please sign in with your new credentials.' });
});

router.put('/account-settings', requireAuth, verifyCsrf, async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    notificationEmail: z.boolean().optional(),
    notificationStatusUpdates: z.boolean().optional(),
    notificationMessages: z.boolean().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(128).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid settings payload.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;

  if (d.newPassword) {
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.authUser.id) as {
      password_hash: string;
    };
    if (!d.currentPassword || !(await bcrypt.compare(d.currentPassword, row.password_hash))) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    const newHash = await bcrypt.hash(d.newPassword, 10);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      newHash,
      req.authUser.id
    );
  }

  db.prepare(
    `
    UPDATE users SET
      full_name = COALESCE(?, full_name),
      notification_email = COALESCE(?, notification_email),
      notification_status_updates = COALESCE(?, notification_status_updates),
      notification_messages = COALESCE(?, notification_messages),
      updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    d.fullName ?? null,
    d.notificationEmail !== undefined ? (d.notificationEmail ? 1 : 0) : null,
    d.notificationStatusUpdates !== undefined ? (d.notificationStatusUpdates ? 1 : 0) : null,
    d.notificationMessages !== undefined ? (d.notificationMessages ? 1 : 0) : null,
    req.authUser.id
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'ACCOUNT_SETTINGS_UPDATED',
    entityType: 'user',
    entityId: req.authUser.id,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Account settings saved.' });
});

export default router;
