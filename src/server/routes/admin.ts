import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb, withTransaction } from '../db/database.ts';
import {
  type AuthedRequest,
  getClientIp,
  requireAuth,
  requireRole,
  STAFF_ROLES,
  verifyCsrf,
  writeAuditLog,
} from '../middleware/security.ts';
import { renderTemplate, sendBrandedEmail } from '../services/email.ts';
import { privateDocumentUpload } from '../services/upload.ts';

const router = Router();
router.use(requireAuth, requireRole(STAFF_ROLES), verifyCsrf);

const APPLICATION_STATUSES = [
  'Submitted',
  'Pending Review',
  'Under Review',
  'Additional Information Required',
  'Negotiation',
  'Approved',
  'Rejected',
  'Active',
  'Completed',
  'Cancelled',
] as const;

router.get('/dashboard', (_req: AuthedRequest, res) => {
  const db = getDb();

  const statusCounts = db
    .prepare(`SELECT status, COUNT(*) as count FROM partner_applications GROUP BY status`)
    .all() as Array<{ status: string; count: number }>;

  const countMap: Record<string, number> = {};
  let totalApplications = 0;
  for (const row of statusCounts) {
    countMap[row.status] = row.count;
    totalApplications += row.count;
  }

  const activePartnershipsRow = db
    .prepare(`SELECT COUNT(*) as count FROM partnerships WHERE status IN ('Active', 'Onboarding')`)
    .get() as { count: number };

  const categoryBreakdown = db
    .prepare(
      `
      SELECT pt.name as category, pt.slug, COUNT(pa.id) as count
      FROM partnership_types pt
      LEFT JOIN partner_applications pa ON pa.partnership_type_slug = pt.slug
      GROUP BY pt.slug, pt.name
      ORDER BY count DESC
    `
    )
    .all();

  const sourceBreakdown = db
    .prepare(
      `SELECT source, COUNT(*) as count FROM partner_applications GROUP BY source ORDER BY count DESC`
    )
    .all();

  const monthlyTrends = db
    .prepare(
      `
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM partner_applications
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
      LIMIT 12
    `
    )
    .all();

  const recentAudit = db
    .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 15`)
    .all();

  const pendingMeetings = db
    .prepare(`SELECT COUNT(*) as count FROM meeting_requests WHERE status = 'Pending'`)
    .get() as { count: number };

  const approvedOrActiveCount =
    (countMap['Approved'] || 0) + (countMap['Active'] || 0) + (countMap['Completed'] || 0);
  const decidedCount = approvedOrActiveCount + (countMap['Rejected'] || 0);
  const approvalRate = decidedCount > 0 ? Math.round((approvedOrActiveCount / decidedCount) * 100) : 0;

  res.json({
    metrics: {
      totalApplications,
      pendingApplications: (countMap['Submitted'] || 0) + (countMap['Pending Review'] || 0),
      underReviewApplications: countMap['Under Review'] || 0,
      negotiationApplications: countMap['Negotiation'] || 0,
      approvedApplications: countMap['Approved'] || 0,
      activePartnerships: activePartnershipsRow.count,
      rejectedApplications: countMap['Rejected'] || 0,
      pendingMeetings: pendingMeetings.count,
      approvalRate,
    },
    statusCounts,
    categoryBreakdown,
    sourceBreakdown,
    monthlyTrends,
    recentAudit,
  });
});

router.get('/applications', (req: AuthedRequest, res) => {
  const db = getDb();
  const status = String(req.query.status || '').trim();
  const category = String(req.query.category || '').trim();
  const q = String(req.query.q || '').trim().toLowerCase();

  let sql = `
    SELECT
      pa.*,
      o.name as organization_name,
      o.organization_type,
      o.country,
      o.website,
      pt.name as partnership_type_name,
      m.full_name as manager_name,
      m.email as manager_email
    FROM partner_applications pa
    JOIN organizations o ON o.id = pa.organization_id
    JOIN partnership_types pt ON pt.slug = pa.partnership_type_slug
    LEFT JOIN users m ON m.id = pa.assigned_manager_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status && status !== 'ALL') {
    sql += ' AND pa.status = ?';
    params.push(status);
  }
  if (category && category !== 'ALL') {
    sql += ' AND pa.partnership_type_slug = ?';
    params.push(category);
  }
  if (q) {
    sql +=
      ' AND (lower(pa.reference_id) LIKE ? OR lower(o.name) LIKE ? OR lower(pa.contact_person) LIKE ? OR lower(pa.contact_email) LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY pa.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ applications: rows });
});

router.get('/applications/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const app = db
    .prepare(
      `
      SELECT
        pa.*,
        o.name as organization_name,
        o.organization_type,
        o.country,
        o.website,
        o.description as organization_description,
        o.year_established,
        pt.name as partnership_type_name,
        m.full_name as manager_name
      FROM partner_applications pa
      JOIN organizations o ON o.id = pa.organization_id
      JOIN partnership_types pt ON pt.slug = pa.partnership_type_slug
      LEFT JOIN users m ON m.id = pa.assigned_manager_id
      WHERE pa.id = ?
    `
    )
    .get(req.params.id);

  if (!app) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  const history = db
    .prepare(
      `
      SELECT ash.*, u.full_name as actor_name, u.email as actor_email
      FROM application_status_history ash
      LEFT JOIN users u ON u.id = ash.changed_by_user_id
      WHERE ash.application_id = ?
      ORDER BY ash.created_at DESC
    `
    )
    .all(req.params.id);

  const notes = db
    .prepare(
      `
      SELECT n.*, u.full_name as author_name
      FROM admin_notes n
      LEFT JOIN users u ON u.id = n.author_user_id
      WHERE n.application_id = ?
      ORDER BY n.created_at DESC
    `
    )
    .all(req.params.id);

  const documents = db
    .prepare(`SELECT id, category, original_filename, mime_type, size_bytes, created_at FROM documents WHERE application_id = ?`)
    .all(req.params.id);

  res.json({ application: app, history, notes, documents });
});

router.patch('/applications/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER', 'REVIEWER']), async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    status: z.enum(APPLICATION_STATUSES),
    note: z.string().trim().max(2000).optional().default(''),
    assignedManagerId: z.string().uuid().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status update payload.' });
    return;
  }

  const db = getDb();
  const app = db
    .prepare('SELECT * FROM partner_applications WHERE id = ?')
    .get(req.params.id) as
    | {
        id: string;
        reference_id: string;
        status: string;
        applicant_user_id: string | null;
        contact_person: string;
        contact_email: string;
        organization_id: string;
        partnership_type_slug: string;
        assigned_manager_id: string | null;
      }
    | undefined;

  if (!app) {
    res.status(404).json({ error: 'Application not found.' });
    return;
  }

  const nextStatus = parsed.data.status;
  const managerId =
    parsed.data.assignedManagerId !== undefined
      ? parsed.data.assignedManagerId
      : app.assigned_manager_id;

  withTransaction(() => {
    db.prepare(
      `UPDATE partner_applications SET status = ?, assigned_manager_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(nextStatus, managerId, app.id);

    db.prepare(
      `
      INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by_user_id, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(
      crypto.randomUUID(),
      app.id,
      app.status,
      nextStatus,
      req.authUser!.id,
      parsed.data.note || `Status updated to ${nextStatus}.`
    );

    if (app.applicant_user_id) {
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, body, category, link_path) VALUES (?, ?, ?, ?, 'APPLICATION', '/portal/status')`
      ).run(
        crypto.randomUUID(),
        app.applicant_user_id,
        `Application ${app.reference_id}: ${nextStatus}`,
        parsed.data.note || `Your partnership application status is now ${nextStatus}.`
      );
    }
  });

  // Respect user notification preference if user account exists
  let shouldEmail = true;
  if (app.applicant_user_id) {
    const pref = db
      .prepare('SELECT notification_email, notification_status_updates FROM users WHERE id = ?')
      .get(app.applicant_user_id) as
      | { notification_email: number; notification_status_updates: number }
      | undefined;
    if (pref && (!pref.notification_email || !pref.notification_status_updates)) {
      shouldEmail = false;
    }
  }

  if (shouldEmail) {
    const rendered = renderTemplate('application_status_changed', {
      contactPerson: app.contact_person,
      referenceId: app.reference_id,
      oldStatus: app.status,
      newStatus: nextStatus,
      note: parsed.data.note || '',
    });
    if (rendered) {
      await sendBrandedEmail({
        to: app.contact_email,
        templateKey: 'application_status_changed',
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
      });
    }
  }

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'APPLICATION_STATUS_CHANGED',
    entityType: 'partner_application',
    entityId: app.id,
    details: { from: app.status, to: nextStatus, referenceId: app.reference_id },
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Application status updated.' });
});

router.post('/applications/:id/notes', (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const note = String(req.body?.note || '').trim();
  if (note.length < 2) {
    res.status(400).json({ error: 'Note text is required.' });
    return;
  }

  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO admin_notes (id, application_id, author_user_id, note) VALUES (?, ?, ?, ?)`
  ).run(id, req.params.id, req.authUser.id, note);

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'ADMIN_NOTE_ADDED',
    entityType: 'partner_application',
    entityId: req.params.id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Internal note added.', id });
});

router.get('/applications-export/csv', (_req: AuthedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT pa.reference_id, o.name as organization_name, pt.name as partnership_type,
             pa.contact_person, pa.contact_email, pa.status, pa.expected_duration, pa.created_at
      FROM partner_applications pa
      JOIN organizations o ON o.id = pa.organization_id
      JOIN partnership_types pt ON pt.slug = pa.partnership_type_slug
      ORDER BY pa.created_at DESC
    `
    )
    .all() as Array<Record<string, unknown>>;

  const headers = [
    'Reference ID',
    'Organization',
    'Partnership Type',
    'Contact Person',
    'Contact Email',
    'Status',
    'Expected Duration',
    'Submitted At',
  ];
  const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.reference_id,
        r.organization_name,
        r.partnership_type,
        r.contact_person,
        r.contact_email,
        r.status,
        r.expected_duration,
        r.created_at,
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="helzerx-applications.csv"');
  res.send(lines.join('\n'));
});

// Organizations / Partners Management
router.get('/partners', (_req: AuthedRequest, res) => {
  const db = getDb();
  const organizations = db
    .prepare(
      `
      SELECT o.*, u.email as owner_email, u.full_name as owner_name, u.status as owner_status,
             (SELECT COUNT(*) FROM partner_applications pa WHERE pa.organization_id = o.id) as application_count
      FROM organizations o
      LEFT JOIN users u ON u.id = o.owner_user_id
      ORDER BY o.created_at DESC
    `
    )
    .all();
  res.json({ organizations });
});

router.patch('/partners/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    publicDirectoryApproved: z.boolean().optional(),
    publicCategory: z.string().trim().max(120).optional().nullable(),
    collaborationSummary: z.string().trim().max(1000).optional().nullable(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid partner update payload.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;
  db.prepare(
    `
    UPDATE organizations SET
      public_directory_approved = COALESCE(?, public_directory_approved),
      public_category = COALESCE(?, public_category),
      collaboration_summary = COALESCE(?, collaboration_summary),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    d.publicDirectoryApproved !== undefined ? (d.publicDirectoryApproved ? 1 : 0) : null,
    d.publicCategory ?? null,
    d.collaborationSummary ?? null,
    d.status ?? null,
    req.params.id
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'PARTNER_ORG_ADMIN_UPDATED',
    entityType: 'organization',
    entityId: req.params.id,
    details: d as Record<string, unknown>,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Partner record updated.' });
});

// Partnerships & Agreements
router.get('/partnerships', (_req: AuthedRequest, res) => {
  const db = getDb();
  const partnerships = db
    .prepare(
      `
      SELECT p.*, o.name as organization_name, pt.name as partnership_type_name, m.full_name as manager_name
      FROM partnerships p
      JOIN organizations o ON o.id = p.organization_id
      JOIN partnership_types pt ON pt.slug = p.partnership_type_slug
      LEFT JOIN users m ON m.id = p.manager_id
      ORDER BY p.created_at DESC
    `
    )
    .all();
  const agreements = db
    .prepare(
      `
      SELECT pa.*, o.name as organization_name
      FROM partnership_agreements pa
      JOIN organizations o ON o.id = pa.organization_id
      ORDER BY pa.created_at DESC
    `
    )
    .all();
  res.json({ partnerships, agreements });
});

router.post('/partnerships', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    applicationId: z.string().uuid().optional().nullable(),
    organizationId: z.string().uuid(),
    partnershipTypeSlug: z.string().min(2),
    managerId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(3).max(180),
    status: z.enum(['Onboarding', 'Active', 'Renewal Due', 'Paused', 'Completed', 'Terminated']).default('Active'),
    benefits: z.array(z.string()).default([]),
    responsibilities: z.array(z.string()).default([]),
    startDate: z.string().optional().nullable(),
    renewalDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    progressPercent: z.number().int().min(0).max(100).default(10),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid partnership details.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;
  const id = crypto.randomUUID();
  db.prepare(
    `
    INSERT INTO partnerships (
      id, application_id, organization_id, partnership_type_slug, manager_id, title,
      status, benefits_json, responsibilities_json, start_date, renewal_date, end_date, progress_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    d.applicationId || null,
    d.organizationId,
    d.partnershipTypeSlug,
    d.managerId || req.authUser.id,
    d.title,
    d.status,
    JSON.stringify(d.benefits),
    JSON.stringify(d.responsibilities),
    d.startDate || null,
    d.renewalDate || null,
    d.endDate || null,
    d.progressPercent
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'PARTNERSHIP_CREATED',
    entityType: 'partnership',
    entityId: id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Partnership record created.', id });
});

router.patch('/partnerships/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  const { status, progressPercent, renewalDate, endDate } = req.body || {};
  db.prepare(
    `
    UPDATE partnerships SET
      status = COALESCE(?, status),
      progress_percent = COALESCE(?, progress_percent),
      renewal_date = COALESCE(?, renewal_date),
      end_date = COALESCE(?, end_date),
      updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(status ?? null, progressPercent ?? null, renewalDate ?? null, endDate ?? null, req.params.id);

  res.json({ message: 'Partnership updated.' });
});

router.post('/agreements', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    organizationId: z.string().uuid(),
    partnershipId: z.string().uuid().optional().nullable(),
    applicationId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(3).max(180),
    agreementType: z.string().trim().min(2).max(80),
    status: z.enum(['Draft', 'Pending Review', 'Sent for Signature', 'Executed', 'Archived']).default('Draft'),
    effectiveDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    documentId: z.string().uuid().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid agreement payload.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;
  const id = crypto.randomUUID();
  db.prepare(
    `
    INSERT INTO partnership_agreements (
      id, partnership_id, application_id, organization_id, title, agreement_type,
      status, effective_date, expiry_date, document_id, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    d.partnershipId || null,
    d.applicationId || null,
    d.organizationId,
    d.title,
    d.agreementType,
    d.status,
    d.effectiveDate || null,
    d.expiryDate || null,
    d.documentId || null,
    req.authUser.id
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'AGREEMENT_CREATED',
    entityType: 'partnership_agreement',
    entityId: id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Agreement record created.', id });
});

// Documents Management
router.get('/documents', (_req: AuthedRequest, res) => {
  const db = getDb();
  const documents = db
    .prepare(
      `
      SELECT d.*, o.name as organization_name, u.full_name as uploader_name
      FROM documents d
      LEFT JOIN organizations o ON o.id = d.organization_id
      LEFT JOIN users u ON u.id = d.uploaded_by_user_id
      ORDER BY d.created_at DESC
    `
    )
    .all();
  const logs = db
    .prepare(
      `
      SELECT dal.*, d.original_filename, u.email as user_email
      FROM document_audit_logs dal
      JOIN documents d ON d.id = dal.document_id
      LEFT JOIN users u ON u.id = dal.user_id
      ORDER BY dal.created_at DESC
      LIMIT 100
    `
    )
    .all();
  res.json({ documents, logs });
});

router.post('/documents', privateDocumentUpload.single('file'), (req: AuthedRequest, res) => {
  if (!req.authUser || !req.file) {
    res.status(400).json({ error: 'File upload required.' });
    return;
  }
  const db = getDb();
  const docId = crypto.randomUUID();
  const category = String(req.body?.category || 'Official Correspondence');
  const organizationId = req.body?.organizationId ? String(req.body.organizationId) : null;
  const applicationId = req.body?.applicationId ? String(req.body.applicationId) : null;
  const accessScope = req.body?.accessScope === 'ADMIN_ONLY' ? 'ADMIN_ONLY' : 'PARTNER_AND_ADMIN';

  db.prepare(
    `
    INSERT INTO documents (id, organization_id, application_id, uploaded_by_user_id, category, original_filename, stored_filename, mime_type, size_bytes, access_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    req.file.size,
    accessScope
  );

  db.prepare(
    `INSERT INTO document_audit_logs (id, document_id, user_id, action, ip_address) VALUES (?, ?, ?, 'UPLOAD', ?)`
  ).run(crypto.randomUUID(), docId, req.authUser.id, getClientIp(req));

  res.status(201).json({ message: 'Document uploaded.', id: docId });
});

// Meetings Management
router.get('/meetings', (_req: AuthedRequest, res) => {
  const db = getDb();
  const meetings = db.prepare(`SELECT * FROM meeting_requests ORDER BY created_at DESC`).all();
  res.json({ meetings });
});

router.patch('/meetings/:id', async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    status: z.enum(['Pending', 'Confirmed', 'Rescheduled', 'Rejected', 'Completed']),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    meetingLink: z.string().trim().max(300).optional().nullable(),
    adminNotes: z.string().trim().max(2000).optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid meeting update payload.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM meeting_requests WHERE id = ?').get(req.params.id) as
    | {
        id: string;
        contact_person: string;
        email: string;
        preferred_date: string;
        preferred_time: string;
      }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Meeting request not found.' });
    return;
  }

  const d = parsed.data;
  const nextDate = d.preferredDate || existing.preferred_date;
  const nextTime = d.preferredTime || existing.preferred_time;

  db.prepare(
    `
    UPDATE meeting_requests SET
      status = ?, preferred_date = ?, preferred_time = ?,
      meeting_link = COALESCE(?, meeting_link),
      admin_notes = COALESCE(?, admin_notes),
      handled_by_user_id = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(d.status, nextDate, nextTime, d.meetingLink ?? null, d.adminNotes ?? null, req.authUser.id, existing.id);

  const rendered = renderTemplate('meeting_confirmation', {
    contactPerson: existing.contact_person,
    preferredDate: nextDate,
    preferredTime: nextTime,
    status: d.status,
    meetingLink: d.meetingLink || 'Provided separately upon confirmation',
  });
  if (rendered) {
    await sendBrandedEmail({
      to: existing.email,
      templateKey: 'meeting_confirmation',
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
    });
  }

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'MEETING_UPDATED',
    entityType: 'meeting_request',
    entityId: existing.id,
    details: { status: d.status },
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Meeting updated and applicant notified.' });
});

// Messages Management
router.get('/messages', (_req: AuthedRequest, res) => {
  const db = getDb();
  const messages = db
    .prepare(
      `
      SELECT m.*, u.full_name as sender_name, u.email as sender_email, o.name as organization_name
      FROM messages m
      JOIN users u ON u.id = m.sender_user_id
      JOIN organizations o ON o.id = m.organization_id
      ORDER BY m.created_at DESC
    `
    )
    .all();
  res.json({ messages });
});

router.post('/messages', async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    organizationId: z.string().uuid(),
    applicationId: z.string().uuid().optional().nullable(),
    subject: z.string().trim().min(2).max(180),
    body: z.string().trim().min(2).max(4000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid message payload.' });
    return;
  }

  const db = getDb();
  const d = parsed.data;
  const id = crypto.randomUUID();
  db.prepare(
    `
    INSERT INTO messages (id, application_id, organization_id, sender_user_id, sender_role, subject, body)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(id, d.applicationId || null, d.organizationId, req.authUser.id, req.authUser.role, d.subject, d.body);

  const orgOwner = db
    .prepare(
      `SELECT u.id, u.email, u.notification_email, u.notification_messages FROM organizations o JOIN users u ON u.id = o.owner_user_id WHERE o.id = ?`
    )
    .get(d.organizationId) as
    | { id: string; email: string; notification_email: number; notification_messages: number }
    | undefined;

  if (orgOwner) {
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, body, category, link_path) VALUES (?, ?, ?, ?, 'MESSAGE', '/portal/messages')`
    ).run(crypto.randomUUID(), orgOwner.id, `New Message: ${d.subject}`, d.body.slice(0, 140));

    if (orgOwner.notification_email && orgOwner.notification_messages) {
      const rendered = renderTemplate('new_message', {
        subject: d.subject,
        senderName: req.authUser.fullName,
      });
      if (rendered) {
        await sendBrandedEmail({
          to: orgOwner.email,
          templateKey: 'new_message',
          subject: rendered.subject,
          htmlBody: rendered.htmlBody,
        });
      }
    }
  }

  res.status(201).json({ message: 'Reply sent.', id });
});

// CMS Content Management
router.get('/cms', (_req: AuthedRequest, res) => {
  const db = getDb();
  const content = db.prepare(`SELECT * FROM website_content ORDER BY section ASC, key ASC`).all();
  const faqs = db.prepare(`SELECT * FROM faqs ORDER BY sort_order ASC`).all();
  const partnershipTypes = db.prepare(`SELECT * FROM partnership_types ORDER BY sort_order ASC`).all();
  const benefits = db.prepare(`SELECT * FROM partnership_benefits ORDER BY category ASC, sort_order ASC`).all();
  const emailTemplates = db.prepare(`SELECT * FROM email_templates ORDER BY key ASC`).all();
  const outbox = db.prepare(`SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 40`).all();
  const contactInquiries = db.prepare(`SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 50`).all();
  res.json({ content, faqs, partnershipTypes, benefits, emailTemplates, outbox, contactInquiries });
});

router.put('/cms/content/:key', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const { title, contentJson } = req.body || {};
  if (!contentJson) {
    res.status(400).json({ error: 'Content payload required.' });
    return;
  }

  const db = getDb();
  const serialized = typeof contentJson === 'string' ? contentJson : JSON.stringify(contentJson);
  db.prepare(
    `UPDATE website_content SET title = COALESCE(?, title), content_json = ?, updated_by_user_id = ?, updated_at = datetime('now') WHERE key = ?`
  ).run(title ?? null, serialized, req.authUser.id, req.params.key);

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'CMS_CONTENT_UPDATED',
    entityType: 'website_content',
    entityId: req.params.key,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Website content updated.' });
});

router.put('/cms/partnership-types/:slug', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  const b = req.body || {};
  db.prepare(
    `
    UPDATE partnership_types SET
      name = COALESCE(?, name),
      short_description = COALESCE(?, short_description),
      overview = COALESCE(?, overview),
      objectives_json = COALESCE(?, objectives_json),
      benefits_json = COALESCE(?, benefits_json),
      expectations_json = COALESCE(?, expectations_json),
      eligibility_json = COALESCE(?, eligibility_json),
      examples_json = COALESCE(?, examples_json),
      conditions_json = COALESCE(?, conditions_json),
      comparison_attributes_json = COALESCE(?, comparison_attributes_json),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE slug = ?
  `
  ).run(
    b.name ?? null,
    b.shortDescription ?? null,
    b.overview ?? null,
    b.objectives ? JSON.stringify(b.objectives) : null,
    b.benefits ? JSON.stringify(b.benefits) : null,
    b.expectations ? JSON.stringify(b.expectations) : null,
    b.eligibility ? JSON.stringify(b.eligibility) : null,
    b.examples ? JSON.stringify(b.examples) : null,
    b.conditions ? JSON.stringify(b.conditions) : null,
    b.comparison ? JSON.stringify(b.comparison) : null,
    b.isActive !== undefined ? (b.isActive ? 1 : 0) : null,
    req.params.slug
  );

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'PARTNERSHIP_TYPE_UPDATED',
    entityType: 'partnership_type',
    entityId: req.params.slug,
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'Partnership type updated.' });
});

router.post('/cms/benefits', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    category: z.enum(['TECHNOLOGY', 'MARKETING', 'BUSINESS', 'COMMUNITY']),
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().min(5).max(1000),
    availabilityTier: z.enum(['CONFIRMED', 'POTENTIAL', 'NEGOTIABLE']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid benefit fields.' });
    return;
  }
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO partnership_benefits (id, category, title, description, availability_tier, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, 99)`
  ).run(id, parsed.data.category, parsed.data.title, parsed.data.description, parsed.data.availabilityTier);
  res.status(201).json({ message: 'Benefit added.', id });
});

router.patch('/cms/benefits/:id', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  const db = getDb();
  const { title, description, availabilityTier, isActive } = req.body || {};
  db.prepare(
    `
    UPDATE partnership_benefits SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      availability_tier = COALESCE(?, availability_tier),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    title ?? null,
    description ?? null,
    availabilityTier ?? null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );
  res.json({ message: 'Benefit updated.' });
});

router.post('/cms/faqs', requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']), (req: AuthedRequest, res) => {
  const { category, question, answer } = req.body || {};
  if (!category || !question || !answer) {
    res.status(400).json({ error: 'Category, question, and answer are required.' });
    return;
  }
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO faqs (id, category, question, answer, sort_order) VALUES (?, ?, ?, ?, 99)`).run(
    id,
    category,
    question,
    answer
  );
  res.status(201).json({ message: 'FAQ added.', id });
});

router.delete('/cms/faqs/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthedRequest, res) => {
  const db = getDb();
  db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  res.json({ message: 'FAQ removed.' });
});

router.put('/cms/email-templates/:key', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthedRequest, res) => {
  const { subject, htmlBody, isActive } = req.body || {};
  const db = getDb();
  db.prepare(
    `UPDATE email_templates SET subject = COALESCE(?, subject), html_body = COALESCE(?, html_body), is_active = COALESCE(?, is_active), updated_at = datetime('now') WHERE key = ?`
  ).run(subject ?? null, htmlBody ?? null, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.key);
  res.json({ message: 'Email template updated.' });
});

// Admin User & RBAC Management
router.get('/users', requireRole(['SUPER_ADMIN', 'ADMIN']), (_req: AuthedRequest, res) => {
  const db = getDb();
  const users = db
    .prepare(
      `SELECT id, email, full_name, role, email_verified, status, last_login_at, created_at FROM users ORDER BY created_at DESC`
    )
    .all();
  res.json({ users });
});

router.post('/users', requireRole(['SUPER_ADMIN']), async (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const schema = z.object({
    email: z.string().trim().email(),
    fullName: z.string().trim().min(2).max(120),
    password: z.string().min(8).max(128),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER', 'REVIEWER', 'PARTNER']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid name, email, password (8+ chars), and role required.' });
    return;
  }

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    res.status(409).json({ error: 'Email already registered.' });
    return;
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(parsed.data.password, 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, email_verified, status) VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE')`
  ).run(id, email, hash, parsed.data.fullName, parsed.data.role);

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'ADMIN_USER_CREATED',
    entityType: 'user',
    entityId: id,
    details: { role: parsed.data.role, email },
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'User created.', id });
});

router.patch('/users/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const { role, status } = req.body || {};
  if (role && req.authUser.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Only SUPER_ADMIN may modify user roles.' });
    return;
  }
  const db = getDb();
  db.prepare(
    `UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?`
  ).run(role ?? null, status ?? null, req.params.id);

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'USER_UPDATED_BY_ADMIN',
    entityType: 'user',
    entityId: req.params.id,
    details: { role, status },
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'User updated.' });
});

// Audit Logs & System Settings
router.get('/audit-logs', (_req: AuthedRequest, res) => {
  const db = getDb();
  const logs = db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`).all();
  res.json({ logs });
});

router.get('/settings', (_req: AuthedRequest, res) => {
  const db = getDb();
  const settings = db.prepare(`SELECT * FROM system_settings ORDER BY key ASC`).all();
  res.json({ settings });
});

router.put('/settings', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const updates = req.body?.settings as Array<{ key: string; value: string }> | undefined;
  if (!Array.isArray(updates)) {
    res.status(400).json({ error: 'Settings array required.' });
    return;
  }

  const db = getDb();
  const stmt = db.prepare(`UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = ?`);
  for (const s of updates) {
    stmt.run(String(s.value), String(s.key));
  }

  writeAuditLog({
    actorUserId: req.authUser.id,
    actorEmail: req.authUser.email,
    action: 'SYSTEM_SETTINGS_UPDATED',
    entityType: 'system_settings',
    details: { keys: updates.map((u) => u.key) },
    ipAddress: getClientIp(req),
  });

  res.json({ message: 'System settings saved.' });
});

// Legal Documentation Management (Drafts, Publishing, Version History & Acceptances)
const legalSubsectionSchema = z.object({
  number: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1).max(200),
  paragraphs: z.array(z.string().trim().min(1)).default([]),
  bullets: z.array(z.string().trim().min(1)).optional(),
});

const legalSectionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  number: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1).max(200),
  paragraphs: z.array(z.string().trim().min(1)).default([]),
  bullets: z.array(z.string().trim().min(1)).optional(),
  subsections: z.array(legalSubsectionSchema).optional(),
});

const legalDocumentEditSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().min(5).max(1000),
  version: z.string().trim().min(1).max(40),
  legalReviewNotice: z.string().trim().min(5).max(2000),
  sections: z.array(legalSectionSchema).min(1),
  changeNote: z.string().trim().max(500).optional().default(''),
});

router.get('/legal', (_req: AuthedRequest, res) => {
  const db = getDb();
  const documents = db
    .prepare(`SELECT * FROM legal_documents ORDER BY sort_order ASC`)
    .all();
  const versions = db
    .prepare(
      `SELECT id, document_key, version, status, title, subtitle, legal_review_notice, sections_json, change_note, created_by_email, created_at
       FROM legal_document_versions
       ORDER BY created_at DESC`
    )
    .all();
  const acceptances = db
    .prepare(
      `SELECT la.*, ld.title as document_title
       FROM legal_acceptances la
       JOIN legal_documents ld ON ld.key = la.document_key
       ORDER BY la.accepted_at DESC
       LIMIT 100`
    )
    .all();
  res.json({ documents, versions, acceptances });
});

router.put(
  '/legal/:key/draft',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']),
  (req: AuthedRequest, res) => {
    if (!req.authUser) return;
    const parsed = legalDocumentEditSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid legal document draft payload.', details: parsed.error.flatten() });
      return;
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT key, status FROM legal_documents WHERE key = ?')
      .get(req.params.key) as { key: string; status: 'DRAFT' | 'PUBLISHED' } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Legal document not found.' });
      return;
    }

    const d = parsed.data;
    const serializedSections = JSON.stringify(d.sections);

    withTransaction(() => {
      if (existing.status === 'DRAFT') {
        db.prepare(
          `
          UPDATE legal_documents SET
            title = ?,
            subtitle = ?,
            version = ?,
            legal_review_notice = ?,
            sections_json = ?,
            draft_title = ?,
            draft_subtitle = ?,
            draft_version = ?,
            draft_legal_review_notice = ?,
            draft_sections_json = ?,
            last_updated_at = datetime('now'),
            updated_by_user_id = ?
          WHERE key = ?
        `
        ).run(
          d.title,
          d.subtitle,
          d.version,
          d.legalReviewNotice,
          serializedSections,
          d.title,
          d.subtitle,
          d.version,
          d.legalReviewNotice,
          serializedSections,
          req.authUser!.id,
          existing.key
        );
      } else {
        db.prepare(
          `
          UPDATE legal_documents SET
            draft_title = ?,
            draft_subtitle = ?,
            draft_version = ?,
            draft_legal_review_notice = ?,
            draft_sections_json = ?,
            updated_by_user_id = ?
          WHERE key = ?
        `
        ).run(
          d.title,
          d.subtitle,
          d.version,
          d.legalReviewNotice,
          serializedSections,
          req.authUser!.id,
          existing.key
        );
      }

      db.prepare(
        `
        INSERT INTO legal_document_versions (
          id, document_key, version, status, title, subtitle, legal_review_notice, sections_json, change_note, created_by_user_id, created_by_email
        ) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        crypto.randomUUID(),
        existing.key,
        d.version,
        d.title,
        d.subtitle,
        d.legalReviewNotice,
        serializedSections,
        d.changeNote || 'Saved draft revision.',
        req.authUser!.id,
        req.authUser!.email
      );
    });

    writeAuditLog({
      actorUserId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'LEGAL_DRAFT_SAVED',
      entityType: 'legal_document',
      entityId: existing.key,
      details: { version: d.version, changeNote: d.changeNote || undefined },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Legal document draft saved and added to version history.' });
  }
);

router.post(
  '/legal/:key/publish',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  (req: AuthedRequest, res) => {
    if (!req.authUser) return;
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM legal_documents WHERE key = ?')
      .get(req.params.key) as
      | {
          key: string;
          draft_title: string;
          draft_subtitle: string;
          draft_version: string;
          draft_legal_review_notice: string;
          draft_sections_json: string;
        }
      | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Legal document not found.' });
      return;
    }

    let pubTitle = existing.draft_title;
    let pubSubtitle = existing.draft_subtitle;
    let pubVersion = existing.draft_version;
    let pubNotice = existing.draft_legal_review_notice;
    let pubSectionsJson = existing.draft_sections_json;
    let changeNote = String(req.body?.changeNote || '').trim() || 'Published legal document.';

    if (req.body && req.body.sections) {
      const parsed = legalDocumentEditSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid legal document publish payload.', details: parsed.error.flatten() });
        return;
      }
      pubTitle = parsed.data.title;
      pubSubtitle = parsed.data.subtitle;
      pubVersion = parsed.data.version;
      pubNotice = parsed.data.legalReviewNotice;
      pubSectionsJson = JSON.stringify(parsed.data.sections);
      if (parsed.data.changeNote) changeNote = parsed.data.changeNote;
    }

    withTransaction(() => {
      db.prepare(
        `
        UPDATE legal_documents SET
          title = ?,
          subtitle = ?,
          version = ?,
          status = 'PUBLISHED',
          legal_review_notice = ?,
          sections_json = ?,
          draft_title = ?,
          draft_subtitle = ?,
          draft_version = ?,
          draft_legal_review_notice = ?,
          draft_sections_json = ?,
          published_at = COALESCE(published_at, datetime('now')),
          last_updated_at = datetime('now'),
          updated_by_user_id = ?
        WHERE key = ?
      `
      ).run(
        pubTitle,
        pubSubtitle,
        pubVersion,
        pubNotice,
        pubSectionsJson,
        pubTitle,
        pubSubtitle,
        pubVersion,
        pubNotice,
        pubSectionsJson,
        req.authUser!.id,
        existing.key
      );

      db.prepare(
        `
        INSERT INTO legal_document_versions (
          id, document_key, version, status, title, subtitle, legal_review_notice, sections_json, change_note, created_by_user_id, created_by_email
        ) VALUES (?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        crypto.randomUUID(),
        existing.key,
        pubVersion,
        pubTitle,
        pubSubtitle,
        pubNotice,
        pubSectionsJson,
        changeNote,
        req.authUser!.id,
        req.authUser!.email
      );
    });

    writeAuditLog({
      actorUserId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'LEGAL_DOCUMENT_PUBLISHED',
      entityType: 'legal_document',
      entityId: existing.key,
      details: { version: pubVersion, changeNote },
      ipAddress: getClientIp(req),
    });

    res.json({ message: 'Legal document published successfully.' });
  }
);

router.post(
  '/legal/:key/restore/:versionId',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER']),
  (req: AuthedRequest, res) => {
    if (!req.authUser) return;
    const db = getDb();
    const doc = db
      .prepare('SELECT key, status FROM legal_documents WHERE key = ?')
      .get(req.params.key) as { key: string; status: 'DRAFT' | 'PUBLISHED' } | undefined;
    const ver = db
      .prepare('SELECT * FROM legal_document_versions WHERE id = ? AND document_key = ?')
      .get(req.params.versionId, req.params.key) as
      | {
          id: string;
          version: string;
          title: string;
          subtitle: string;
          legal_review_notice: string;
          sections_json: string;
        }
      | undefined;

    if (!doc || !ver) {
      res.status(404).json({ error: 'Legal document or historical version not found.' });
      return;
    }

    withTransaction(() => {
      if (doc.status === 'DRAFT') {
        db.prepare(
          `
          UPDATE legal_documents SET
            title = ?, subtitle = ?, version = ?, legal_review_notice = ?, sections_json = ?,
            draft_title = ?, draft_subtitle = ?, draft_version = ?, draft_legal_review_notice = ?, draft_sections_json = ?,
            last_updated_at = datetime('now'),
            updated_by_user_id = ?
          WHERE key = ?
        `
        ).run(
          ver.title,
          ver.subtitle,
          ver.version,
          ver.legal_review_notice,
          ver.sections_json,
          ver.title,
          ver.subtitle,
          ver.version,
          ver.legal_review_notice,
          ver.sections_json,
          req.authUser!.id,
          doc.key
        );
      } else {
        db.prepare(
          `
          UPDATE legal_documents SET
            draft_title = ?, draft_subtitle = ?, draft_version = ?, draft_legal_review_notice = ?, draft_sections_json = ?,
            updated_by_user_id = ?
          WHERE key = ?
        `
        ).run(
          ver.title,
          ver.subtitle,
          ver.version,
          ver.legal_review_notice,
          ver.sections_json,
          req.authUser!.id,
          doc.key
        );
      }
    });

    writeAuditLog({
      actorUserId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'LEGAL_VERSION_RESTORED_TO_DRAFT',
      entityType: 'legal_document',
      entityId: doc.key,
      details: { restoredVersionId: ver.id, version: ver.version },
      ipAddress: getClientIp(req),
    });

    res.json({ message: `Version ${ver.version} loaded into editor draft.` });
  }
);

export default router;
