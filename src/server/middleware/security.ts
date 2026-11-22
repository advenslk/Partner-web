import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/database.ts';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PARTNERSHIP_MANAGER'
  | 'REVIEWER'
  | 'PARTNER';

export const STAFF_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PARTNERSHIP_MANAGER',
  'REVIEWER',
];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: boolean;
  status: string;
  csrfToken: string;
  sessionId: string;
}

export interface AuthedRequest extends Request {
  authUser?: AuthUser;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'helzerx-dev-session-secret-change-in-production';

export function hashToken(raw: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('hex');
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function setSessionCookie(req: Request, res: Response, rawToken: string): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('hx_session', rawToken, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('hx_session', {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
  });
}

export function attachSession(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const rawToken = req.cookies?.hx_session;
  if (!rawToken || typeof rawToken !== 'string') {
    return next();
  }

  const tokenHash = hashToken(rawToken);
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        s.id as session_id,
        s.csrf_token,
        s.expires_at,
        u.id as user_id,
        u.email,
        u.full_name,
        u.role,
        u.email_verified,
        u.status
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
    `
    )
    .get(tokenHash) as
    | {
        session_id: string;
        csrf_token: string;
        expires_at: string;
        user_id: string;
        email: string;
        full_name: string;
        role: UserRole;
        email_verified: number;
        status: string;
      }
    | undefined;

  if (!row) {
    return next();
  }

  if (new Date(row.expires_at).getTime() <= Date.now() || row.status !== 'ACTIVE') {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.session_id);
    return next();
  }

  req.authUser = {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    status: row.status,
    csrfToken: row.csrf_token,
    sessionId: row.session_id,
  };

  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this resource.' });
      return;
    }
    next();
  };
}

export function verifyCsrf(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  if (!req.authUser) {
    return next();
  }
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || headerToken !== req.authUser.csrfToken) {
    res.status(403).json({ error: 'Invalid or missing CSRF token.' });
    return;
  }
  next();
}

// In-memory sliding window rate limiter
const rateStore = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.path}:${getClientIp(req)}`;
    const now = Date.now();
    const entries = (rateStore.get(key) || []).filter((ts) => now - ts < windowMs);
    if (entries.length >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }
    entries.push(now);
    rateStore.set(key, entries);
    next();
  };
}

export function writeAuditLog(params: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): void {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, entity_type, entity_id, details_json, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    crypto.randomUUID(),
    params.actorUserId || null,
    params.actorEmail || null,
    params.action,
    params.entityType,
    params.entityId || null,
    JSON.stringify(params.details || {}),
    params.ipAddress || null
  );
}
