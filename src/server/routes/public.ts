import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getDb, withTransaction } from '../db/database.ts';
import {
  type AuthedRequest,
  getClientIp,
  rateLimit,
  writeAuditLog,
} from '../middleware/security.ts';
import { renderTemplate, sendBrandedEmail } from '../services/email.ts';
import { privateDocumentUpload } from '../services/upload.ts';
import { streamLegalDocumentPdf } from '../services/legalPdf.ts';
import type { LegalSection } from '../db/legalSeedData.ts';

const router = Router();

function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

router.get('/bootstrap', (_req, res) => {
  const db = getDb();

  const contentRows = db.prepare('SELECT key, section, title, content_json FROM website_content').all() as Array<{
    key: string;
    section: string;
    title: string;
    content_json: string;
  }>;

  const content: Record<string, unknown> = {};
  for (const row of contentRows) {
    if (row.section !== 'legal') {
      content[row.key] = parseJsonSafe(row.content_json, {});
    }
  }

  const legalRows = db
    .prepare(
      `
      SELECT key, slug, tab_label, title, subtitle, version, status, legal_review_notice,
             published_at, last_updated_at, sections_json
      FROM legal_documents
      ORDER BY sort_order ASC
    `
    )
    .all() as Array<{
    key: string;
    slug: string;
    tab_label: string;
    title: string;
    subtitle: string;
    version: string;
    status: 'DRAFT' | 'PUBLISHED';
    legal_review_notice: string;
    published_at: string | null;
    last_updated_at: string;
    sections_json: string;
  }>;

  const legal: Record<string, unknown> = {};
  for (const row of legalRows) {
    legal[row.key] = {
      key: row.key,
      slug: row.slug,
      tabLabel: row.tab_label,
      title: row.title,
      subtitle: row.subtitle,
      version: row.version,
      status: row.status,
      isDraft: row.status === 'DRAFT',
      legalReviewNotice: row.legal_review_notice,
      publishedAt: row.published_at,
      lastUpdatedAt: row.last_updated_at,
      sections: parseJsonSafe<LegalSection[]>(row.sections_json, []),
    };
  }

  const partnershipTypes = (
    db
      .prepare('SELECT * FROM partnership_types WHERE is_active = 1 ORDER BY sort_order ASC')
      .all() as Array<Record<string, unknown>>
  ).map((t) => ({
    id: t.id,
    slug: t.slug,
    code: t.code,
    name: t.name,
    shortDescription: t.short_description,
    overview: t.overview,
    objectives: parseJsonSafe<string[]>(String(t.objectives_json), []),
    benefits: parseJsonSafe<string[]>(String(t.benefits_json), []),
    expectations: parseJsonSafe<string[]>(String(t.expectations_json), []),
    eligibility: parseJsonSafe<string[]>(String(t.eligibility_json), []),
    examples: parseJsonSafe<string[]>(String(t.examples_json), []),
    conditions: parseJsonSafe<string[]>(String(t.conditions_json), []),
    comparison: parseJsonSafe<Record<string, string>>(String(t.comparison_attributes_json), {}),
  }));

  const benefits = db
    .prepare('SELECT id, category, title, description, availability_tier FROM partnership_benefits WHERE is_active = 1 ORDER BY sort_order ASC')
    .all();

  const requirements = db
    .prepare('SELECT id, title, description, category, is_mandatory FROM partnership_requirements ORDER BY sort_order ASC')
    .all();

  const faqs = db
    .prepare('SELECT id, category, question, answer FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC')
    .all();

  const directory = db
    .prepare(
      `
      SELECT id, name, organization_type, country, website, description, logo_url, public_category, collaboration_summary
      FROM organizations
      WHERE public_directory_approved = 1 AND status = 'ACTIVE'
      ORDER BY name ASC
    `
    )
    .all();

  const settingsRows = db.prepare('SELECT key, value FROM system_settings').all() as Array<{
    key: string;
    value: string;
  }>;
  const settings: Record<string, string> = {};
  for (const s of settingsRows) {
    settings[s.key] = s.value;
  }

  res.json({
    content,
    legal,
    partnershipTypes,
    benefits,
    requirements,
    faqs,
    directory,
    settings: {
      portalName: settings.portal_name || 'HelzerX Partnerships',
      applicationsOpen: settings.applications_open !== 'false',
    },
  });
});

const applicationSchema = z.object({
  organizationName: z.string().trim().min(2).max(180),
  organizationType: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  website: z.string().trim().max(240).optional().default(''),
  organizationDescription: z.string().trim().min(10).max(3000),
  yearEstablished: z.string().trim().optional().default(''),
  socialLinks: z.string().trim().optional().default('{}'),
  contactPerson: z.string().trim().min(2).max(120),
  contactPosition: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(180),
  discordUsername: z.string().trim().max(80).optional().default(''),
  phoneNumber: z.string().trim().max(40).optional().default(''),
  partnershipTypeSlug: z.string().trim().min(2).max(60),
  whyPartner: z.string().trim().min(10).max(4000),
  whatCanOffer: z.string().trim().min(10).max(4000),
  whatExpect: z.string().trim().min(10).max(4000),
  objectives: z.string().trim().min(10).max(4000),
  resourcesContributed: z.string().trim().min(3).max(2000),
  expectedDuration: z.string().trim().min(2).max(120),
  additionalInfo: z.string().trim().max(4000).optional().default(''),
  termsAccepted: z.union([z.boolean(), z.string()]).refine((v) => v === true || v === 'true'),
  privacyAccepted: z.union([z.boolean(), z.string()]).refine((v) => v === true || v === 'true'),
});

router.post(
  '/applications',
  rateLimit(10, 15 * 60 * 1000),
  privateDocumentUpload.fields([
    { name: 'companyProfile', maxCount: 1 },
    { name: 'businessProposal', maxCount: 1 },
    { name: 'supportingDocuments', maxCount: 1 },
    { name: 'portfolio', maxCount: 1 },
  ]),
  async (req: AuthedRequest, res) => {
    const db = getDb();
    const openSetting = db
      .prepare(`SELECT value FROM system_settings WHERE key = 'applications_open'`)
      .get() as { value: string } | undefined;
    if (openSetting?.value === 'false') {
      res.status(403).json({ error: 'Partnership applications are temporarily paused.' });
      return;
    }

    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please complete all required application fields.', details: parsed.error.flatten() });
      return;
    }

    const d = parsed.data;
    const typeExists = db
      .prepare('SELECT slug, name FROM partnership_types WHERE slug = ? AND is_active = 1')
      .get(d.partnershipTypeSlug) as { slug: string; name: string } | undefined;
    if (!typeExists) {
      res.status(400).json({ error: 'Selected partnership type is invalid.' });
      return;
    }

    const yearEst = d.yearEstablished ? Number.parseInt(d.yearEstablished, 10) : null;
    const normalizedEmail = d.contactEmail.toLowerCase();

    // Link existing authenticated user or matching user account
    let linkedUserId = req.authUser?.id || null;
    if (!linkedUserId) {
      const existingUser = db
        .prepare('SELECT id FROM users WHERE email = ?')
        .get(normalizedEmail) as { id: string } | undefined;
      if (existingUser) {
        linkedUserId = existingUser.id;
      }
    }

    // Generate sequential Reference ID: HX-PARTNER-2026-0000X
    const year = new Date().getFullYear();
    const countRow = db.prepare('SELECT COUNT(*) as total FROM partner_applications').get() as {
      total: number;
    };
    const nextSeq = String(countRow.total + 1).padStart(5, '0');
    const referenceId = `HX-PARTNER-${year}-${nextSeq}`;

    const orgId = crypto.randomUUID();
    const appId = crypto.randomUUID();

    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const fileCategoryMap: Array<{ field: string; category: string }> = [
      { field: 'companyProfile', category: 'Company Profiles' },
      { field: 'businessProposal', category: 'Business Proposals' },
      { field: 'supportingDocuments', category: 'Supporting Documents' },
      { field: 'portfolio', category: 'Supporting Documents' },
    ];

    withTransaction(() => {
      // Reuse existing organization owned by this user if available, else create new
      let resolvedOrgId: string = orgId;
      if (linkedUserId) {
        const existingOrg = db
          .prepare('SELECT id FROM organizations WHERE owner_user_id = ? LIMIT 1')
          .get(linkedUserId) as { id: string } | undefined;
        if (existingOrg) {
          resolvedOrgId = existingOrg.id;
          db.prepare(
            `UPDATE organizations SET name = ?, organization_type = ?, country = ?, website = ?, description = ?, year_established = ?, social_links_json = ?, updated_at = datetime('now') WHERE id = ?`
          ).run(
            d.organizationName,
            d.organizationType,
            d.country,
            d.website || null,
            d.organizationDescription,
            Number.isFinite(yearEst) ? yearEst : null,
            d.socialLinks || '{}',
            resolvedOrgId
          );
        } else {
          db.prepare(
            `
            INSERT INTO organizations (id, owner_user_id, name, organization_type, country, website, description, year_established, social_links_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            resolvedOrgId,
            linkedUserId,
            d.organizationName,
            d.organizationType,
            d.country,
            d.website || null,
            d.organizationDescription,
            Number.isFinite(yearEst) ? yearEst : null,
            d.socialLinks || '{}'
          );
          db.prepare(
            `INSERT INTO organization_members (id, organization_id, user_id, member_role) VALUES (?, ?, ?, 'OWNER')`
          ).run(crypto.randomUUID(), resolvedOrgId, linkedUserId);
        }
      } else {
        db.prepare(
          `
          INSERT INTO organizations (id, owner_user_id, name, organization_type, country, website, description, year_established, social_links_json)
          VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          resolvedOrgId,
          d.organizationName,
          d.organizationType,
          d.country,
          d.website || null,
          d.organizationDescription,
          Number.isFinite(yearEst) ? yearEst : null,
          d.socialLinks || '{}'
        );
      }

      db.prepare(
        `
        INSERT INTO partner_applications (
          id, reference_id, applicant_user_id, organization_id, partnership_type_slug,
          contact_person, contact_position, contact_email, discord_username, phone_number,
          why_partner, what_can_offer, what_expect, objectives, resources_contributed,
          expected_duration, additional_info, source, status, terms_accepted, privacy_accepted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Direct Portal', 'Submitted', 1, 1)
      `
      ).run(
        appId,
        referenceId,
        linkedUserId,
        resolvedOrgId,
        d.partnershipTypeSlug,
        d.contactPerson,
        d.contactPosition,
        normalizedEmail,
        d.discordUsername || null,
        d.phoneNumber || null,
        d.whyPartner,
        d.whatCanOffer,
        d.whatExpect,
        d.objectives,
        d.resourcesContributed,
        d.expectedDuration,
        d.additionalInfo || null
      );

      db.prepare(
        `
        INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by_user_id, note)
        VALUES (?, ?, NULL, 'Submitted', ?, 'Application submitted via HelzerX Partnerships Portal.')
      `
      ).run(crypto.randomUUID(), appId, linkedUserId);

      for (const mapping of fileCategoryMap) {
        const uploadedList = files[mapping.field];
        if (uploadedList && uploadedList.length > 0) {
          const f = uploadedList[0];
          const docId = crypto.randomUUID();
          db.prepare(
            `
            INSERT INTO documents (id, organization_id, application_id, uploaded_by_user_id, category, original_filename, stored_filename, mime_type, size_bytes, access_scope)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PARTNER_AND_ADMIN')
          `
          ).run(
            docId,
            resolvedOrgId,
            appId,
            linkedUserId,
            mapping.category,
            f.originalname,
            f.filename,
            f.mimetype,
            f.size
          );
          db.prepare(
            `INSERT INTO document_audit_logs (id, document_id, user_id, action, ip_address) VALUES (?, ?, ?, 'UPLOAD', ?)`
          ).run(crypto.randomUUID(), docId, linkedUserId, getClientIp(req));
        }
      }

      if (linkedUserId) {
        db.prepare(
          `INSERT INTO notifications (id, user_id, title, body, category, link_path) VALUES (?, ?, ?, ?, 'APPLICATION', '/portal/status')`
        ).run(
          crypto.randomUUID(),
          linkedUserId,
          `Application Submitted (${referenceId})`,
          `Your ${typeExists.name} proposal for ${d.organizationName} has been received.`
        );
      }

      const legalVersions = db
        .prepare(`SELECT key, version FROM legal_documents WHERE key IN ('legal_privacy', 'legal_terms', 'legal_partnership_terms')`)
        .all() as Array<{ key: string; version: string }>;
      const acceptStmt = db.prepare(
        `
        INSERT INTO legal_acceptances (id, user_id, user_email, organization_name, application_id, document_key, document_version, context, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PARTNERSHIP_APPLICATION', ?, ?)
      `
      );
      const clientIp = getClientIp(req);
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 250);
      for (const lv of legalVersions) {
        acceptStmt.run(
          crypto.randomUUID(),
          linkedUserId,
          normalizedEmail,
          d.organizationName,
          appId,
          lv.key,
          lv.version,
          clientIp,
          userAgent
        );
      }
    });

    const rendered = renderTemplate('application_confirmation', {
      contactPerson: d.contactPerson,
      organizationName: d.organizationName,
      referenceId,
      status: 'Submitted',
    });
    if (rendered) {
      await sendBrandedEmail({
        to: normalizedEmail,
        templateKey: 'application_confirmation',
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
      });
    }

    writeAuditLog({
      actorUserId: linkedUserId,
      actorEmail: normalizedEmail,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'partner_application',
      entityId: appId,
      details: { referenceId, partnershipType: d.partnershipTypeSlug },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      message: 'Partnership application submitted successfully.',
      applicationId: appId,
      referenceId,
      status: 'Submitted',
    });
  }
);

router.post('/meetings', rateLimit(10, 15 * 60 * 1000), (req: AuthedRequest, res) => {
  const schema = z.object({
    organizationName: z.string().trim().min(2).max(180),
    contactPerson: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    preferredDate: z.string().trim().min(4).max(30),
    preferredTime: z.string().trim().min(2).max(30),
    meetingType: z.string().trim().min(2).max(80),
    purpose: z.string().trim().min(10).max(2000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please complete all meeting request fields.' });
    return;
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const d = parsed.data;
  db.prepare(
    `
    INSERT INTO meeting_requests (id, organization_name, contact_person, email, preferred_date, preferred_time, meeting_type, purpose, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    d.organizationName,
    d.contactPerson,
    d.email.toLowerCase(),
    d.preferredDate,
    d.preferredTime,
    d.meetingType,
    d.purpose,
    req.authUser?.id || null
  );

  writeAuditLog({
    actorUserId: req.authUser?.id || null,
    actorEmail: d.email.toLowerCase(),
    action: 'MEETING_REQUESTED',
    entityType: 'meeting_request',
    entityId: id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Meeting request submitted. Our partnerships team will confirm shortly.', id });
});

router.post('/contact', rateLimit(10, 15 * 60 * 1000), (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    organization: z.string().trim().max(180).optional().default(''),
    subject: z.string().trim().min(3).max(180),
    message: z.string().trim().min(10).max(3000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Please fill in your name, valid email, subject, and message.' });
    return;
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const d = parsed.data;
  db.prepare(
    `INSERT INTO contact_inquiries (id, name, email, organization, subject, message) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, d.name, d.email.toLowerCase(), d.organization || null, d.subject, d.message);

  writeAuditLog({
    actorEmail: d.email.toLowerCase(),
    action: 'CONTACT_INQUIRY_SUBMITTED',
    entityType: 'contact_inquiry',
    entityId: id,
    ipAddress: getClientIp(req),
  });

  res.status(201).json({ message: 'Your inquiry has been received by HelzerX Technologies.' });
});

router.get('/legal/:slug/pdf', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT slug, title, subtitle, version, status, legal_review_notice, published_at, last_updated_at, sections_json
      FROM legal_documents
      WHERE slug = ? OR key = ?
    `
    )
    .get(req.params.slug, req.params.slug) as
    | {
        slug: string;
        title: string;
        subtitle: string;
        version: string;
        status: string;
        legal_review_notice: string;
        published_at: string | null;
        last_updated_at: string;
        sections_json: string;
      }
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Legal document not found.' });
    return;
  }

  const sections = parseJsonSafe<LegalSection[]>(row.sections_json, []);
  streamLegalDocumentPdf(
    {
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      version: row.version,
      status: row.status,
      legalReviewNotice: row.legal_review_notice,
      publishedAt: row.published_at,
      lastUpdatedAt: row.last_updated_at,
      sections,
    },
    res
  );
});

router.post('/legal/:slug/accept', rateLimit(30, 15 * 60 * 1000), (req: AuthedRequest, res) => {
  const schema = z.object({
    email: z.string().trim().email().max(180).optional(),
    organizationName: z.string().trim().max(180).optional(),
    context: z.string().trim().min(2).max(80).optional(),
  });
  const parsed = schema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Please provide a valid email address if entering one manually.' });
    return;
  }

  const db = getDb();
  const doc = db
    .prepare('SELECT key, slug, title, version FROM legal_documents WHERE slug = ? OR key = ?')
    .get(req.params.slug, req.params.slug) as
    | { key: string; slug: string; title: string; version: string }
    | undefined;

  if (!doc) {
    res.status(404).json({ error: 'Legal document not found.' });
    return;
  }

  const effectiveEmail = (parsed.data.email || req.authUser?.email || '').toLowerCase() || null;
  if (!req.authUser && !effectiveEmail) {
    res.status(400).json({ error: 'Please sign in or provide a business email to record your acknowledgment.' });
    return;
  }

  const id = crypto.randomUUID();
  const context = parsed.data.context || 'LEGAL_PORTAL_ACKNOWLEDGMENT';
  db.prepare(
    `
    INSERT INTO legal_acceptances (id, user_id, user_email, organization_name, document_key, document_version, context, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    req.authUser?.id || null,
    effectiveEmail,
    parsed.data.organizationName || null,
    doc.key,
    doc.version,
    context,
    getClientIp(req),
    String(req.headers['user-agent'] || '').slice(0, 250)
  );

  writeAuditLog({
    actorUserId: req.authUser?.id || null,
    actorEmail: effectiveEmail,
    action: 'LEGAL_POLICY_ACCEPTED',
    entityType: 'legal_document',
    entityId: doc.key,
    details: { version: doc.version, context },
    ipAddress: getClientIp(req),
  });

  res.status(201).json({
    message: `Acknowledgment recorded for ${doc.title} (Version ${doc.version}).`,
    acceptanceId: id,
    documentKey: doc.key,
    version: doc.version,
  });
});

export default router;
