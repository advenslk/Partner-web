import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database.ts';
import {
  type AuthedRequest,
  getClientIp,
  requireAuth,
  verifyCsrf,
  writeAuditLog,
} from '../middleware/security.ts';
import { privateDocumentUpload } from '../services/upload.ts';

const router = Router();
router.use(requireAuth, verifyCsrf);

function getUserOrgIds(userId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id FROM organizations WHERE owner_user_id = ?
      UNION
      SELECT organization_id as id FROM organization_members WHERE user_id = ?
    `
    )
    .all(userId, userId) as Array<{ id: string }>;
  return rows.map((r) => r.id);
}

router.get('/overview', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  const orgIds = getUserOrgIds(req.authUser.id);

  const organizations =
    orgIds.length > 0
      ? db
          .prepare(
            `SELECT * FROM organizations WHERE id IN (${orgIds.map(() => '?').join(',')})`
          )
          .all(...orgIds)
      : [];

  const applications = db
    .prepare(
      `
      SELECT
        pa.*,
        o.name as organization_name,
        pt.name as partnership_type_name,
        m.full_name as manager_name,
        m.email as manager_email
      FROM partner_applications pa
      JOIN organizations o ON o.id = pa.organization_id
      JOIN partnership_types pt ON pt.slug = pa.partnership_type_slug
      LEFT JOIN users m ON m.id = pa.assigned_manager_id
      WHERE pa.applicant_user_id = ?
         OR pa.organization_id IN (SELECT id FROM organizations WHERE owner_user_id = ?)
      ORDER BY pa.created_at DESC
    `
    )
    .all(req.authUser.id, req.authUser.id);

  const statusHistory = db
    .prepare(
      `
      SELECT ash.*, pa.reference_id, u.full_name as actor_name
      FROM application_status_history ash
      JOIN partner_applications pa ON pa.id = ash.application_id
      LEFT JOIN users u ON u.id = ash.changed_by_user_id
      WHERE pa.applicant_user_id = ?
         OR pa.organization_id IN (SELECT id FROM organizations WHERE owner_user_id = ?)
      ORDER BY ash.created_at DESC
    `
    )
    .all(req.authUser.id, req.authUser.id);

  const partnerships =
    orgIds.length > 0
      ? db
          .prepare(
            `
            SELECT p.*, pt.name as partnership_type_name, m.full_name as manager_name, m.email as manager_email
            FROM partnerships p
            JOIN partnership_types pt ON pt.slug = p.partnership_type_slug
            LEFT JOIN users m ON m.id = p.manager_id
            WHERE p.organization_id IN (${orgIds.map(() => '?').join(',')})
            ORDER BY p.created_at DESC
          `
          )
          .all(...orgIds)
      : [];

  const agreements =
    orgIds.length > 0
      ? db
          .prepare(
            `
            SELECT pa.*, o.name as organization_name
            FROM partnership_agreements pa
            JOIN organizations o ON o.id = pa.organization_id
            WHERE pa.organization_id IN (${orgIds.map(() => '?').join(',')})
            ORDER BY pa.created_at DESC
          `
          )
          .all(...orgIds)
      : [];

  const documents = db
    .prepare(
      `
      SELECT d.id, d.category, d.original_filename, d.mime_type, d.size_bytes, d.created_at, d.application_id, d.organization_id
      FROM documents d
      WHERE d.access_scope = 'PARTNER_AND_ADMIN'
        AND (
          d.uploaded_by_user_id = ?
          OR d.organization_id IN (SELECT id FROM organizations WHERE owner_user_id = ?)
        )
      ORDER BY d.created_at DESC
    `
    )
    .all(req.authUser.id, req.authUser.id);

  const messages = db
    .prepare(
      `
      SELECT m.*, u.full_name as sender_name, o.name as organization_name
      FROM messages m
      JOIN users u ON u.id = m.sender_user_id
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.organization_id IN (
        SELECT id FROM organizations WHERE owner_user_id = ?
        UNION
        SELECT organization_id FROM organization_members WHERE user_id = ?
      )
      ORDER BY m.created_at ASC
    `
    )
    .all(req.authUser.id, req.authUser.id);

  const notifications = db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(req.authUser.id);

  const meetings = db
    .prepare(
      `SELECT * FROM meeting_requests WHERE user_id = ? OR lower(email) = ? ORDER BY created_at DESC`
    )
    .all(req.authUser.id, req.authUser.email.toLowerCase());

  res.json({
    organizations,
    applications,
    statusHistory,
    partnerships,
    agreements,
    documents,
    messages,
    notifications,
    meetings,
  });
});

router.put('/organization', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    organizationId: z.string().uuid(),
    name: z.string().trim().min(2).max(180),
    organizationType: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    website: z.string().trim().max(240).optional().default(''),
    description: z.string().trim().min(10).max(3000),
    yearEstablished: z.number().int().min(1900).max(2100).nullable().optional(),
    collaborationSummary: z.string().trim().max(1000).optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid organization details.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;
  const orgIds = getUserOrgIds(req.authUser.id);
  if (!orgIds.includes(d.organizationId)) {
    res.status(403).json({ error: 'You do not have permission to update this organization.' });
    return;
  }

  db.prepare(
    `
    UPDATE organizations SET
      name = ?, organization_type = ?, country = ?, website = ?, description = ?,
      year_established = ?, collaboration_summary = ?, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    d.name,
    d.organizationType,
    d.country,
    d.website || null,
    d.description,
    d.yearEstablished ?? null,
    d.collaborationSummary || null,
    d.organizationId
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'PARTNER_ORG_UPDATED',
    entityType: 'organization',
    entityId: d.organizationId,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Organization profile updated.' });
});

router.post('/messages', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    organizationId: z.string().uuid(),
    applicationId: z.string().uuid().optional().nullable(),
    subject: z.string().trim().min(2).max(180),
    body: z.string().trim().min(2).max(4000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Message subject and body are required.' });
    return;
  }

  const d = parsed.data;
  const orgIds = getUserOrgIds(req.authUser.id);
  if (!orgIds.includes(d.organizationId)) {
    res.status(403).json({ error: 'Unauthorized organization access.' });
    return;
  }

  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `
    INSERT INTO messages (id, application_id, organization_id, sender_user_id, sender_role, subject, body)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(id, d.applicationId || null, d.organizationId, req.authUser.id, req.authUser.role, d.subject, d.body);

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'PARTNER_MESSAGE_SENT',
    entityType: 'message',
    entityId: id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Message sent to HelzerX Partnerships.', id });
});

router.post('/documents', privateDocumentUpload.single('file'), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  if (!req.file) {
    res.status(400).json({ error: 'Please select a document file to upload.' });
    return;
  }

  const category = String(req.body?.category || 'Supporting Documents');
  const validCategories = [
    'Company Profiles',
    'Business Proposals',
    'Partnership Agreements',
    'NDAs',
    'Supporting Documents',
    'Official Correspondence',
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: 'Invalid document category.' });
    return;
  }

  const orgIds = getUserOrgIds(req.authUser.id);
  const organizationId = String(req.body?.organizationId || orgIds[0] || '');
  if (!organizationId || !orgIds.includes(organizationId)) {
    res.status(403).json({ error: 'Valid organization ownership required for document uploads.' });
    return;
  }

  const applicationId = req.body?.applicationId ? String(req.body.applicationId) : null;
  const db = getDb();
  const docId = crypto.randomUUID();

  db.prepare(
    `
    INSERT INTO documents (id, organization_id, application_id, uploaded_by_user_id, category, original_filename, stored_filename, mime_type, size_bytes, access_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PARTNER_AND_ADMIN')
  `
  ).run(
    docId,
    organizationId,
    applicationId,
    req.authUser.id,
    category,
    req.file.originalname,
    req.file.filename,
    req.file.mimetype,
    req.file.size
  );

  db.prepare(
    `INSERT INTO document_audit_logs (id, document_id, user_id, action, ip_address) VALUES (?, ?, ?, 'UPLOAD', ?)`
  ).run(crypto.randomUUID(), docId, req.authUser.id, getClientIp(req));

  res.status(201).json({ message: 'Document uploaded securely.', id: docId });
});

router.patch('/notifications/:id/read', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(
    req.params.id,
    req.authUser.id
  );
  res.json({ ok: true });
});

router.patch('/notifications/read-all', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.authUser.id);
  res.json({ ok: true });
});

export default router;
