import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { getDb } from '../db/database.ts';
import {
  type AuthedRequest,
  getClientIp,
  requireAuth,
  STAFF_ROLES,
} from '../middleware/security.ts';
import { getPrivateUploadDir } from '../services/upload.ts';

const router = Router();

router.get('/:id/download', requireAuth, (req: AuthedRequest, res) => {
  if (!req.authUser) return;
  const db = getDb();
  const doc = db
    .prepare('SELECT * FROM documents WHERE id = ?')
    .get(req.params.id) as
    | {
        id: string;
        organization_id: string | null;
        uploaded_by_user_id: string | null;
        original_filename: string;
        stored_filename: string;
        mime_type: string;
        access_scope: string;
      }
    | undefined;

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  const isStaff = STAFF_ROLES.includes(req.authUser.role);
  if (!isStaff) {
    if (doc.access_scope === 'ADMIN_ONLY') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    const ownsDoc =
      doc.uploaded_by_user_id === req.authUser.id ||
      Boolean(
        doc.organization_id &&
          db
            .prepare(
              `SELECT 1 FROM organizations WHERE id = ? AND owner_user_id = ?
               UNION
               SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ?`
            )
            .get(doc.organization_id, req.authUser.id, doc.organization_id, req.authUser.id)
      );
    if (!ownsDoc) {
      res.status(403).json({ error: 'You are not authorized to download this document.' });
      return;
    }
  }

  const safePath = path.resolve(getPrivateUploadDir(), path.basename(doc.stored_filename));
  if (!fs.existsSync(safePath)) {
    res.status(404).json({ error: 'Stored file missing on disk.' });
    return;
  }

  db.prepare(
    `INSERT INTO document_audit_logs (id, document_id, user_id, action, ip_address) VALUES (?, ?, ?, 'DOWNLOAD', ?)`
  ).run(crypto.randomUUID(), doc.id, req.authUser.id, getClientIp(req));

  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${doc.original_filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
  );
  fs.createReadStream(safePath).pipe(res);
});

export default router;
