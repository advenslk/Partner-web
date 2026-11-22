import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { getDb } from '../db/database.ts';

interface EmailDispatchOptions {
  to: string;
  templateKey?: string;
  subject: string;
  htmlBody: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export function renderTemplate(templateKey: string, variables: Record<string, string>): { subject: string; htmlBody: string } | null {
  const db = getDb();
  const tpl = db
    .prepare('SELECT subject, html_body, is_active FROM email_templates WHERE key = ?')
    .get(templateKey) as { subject: string; html_body: string; is_active: number } | undefined;

  if (!tpl || !tpl.is_active) {
    return null;
  }

  let subject = tpl.subject;
  let htmlBody = tpl.html_body;

  for (const [k, v] of Object.entries(variables)) {
    const escaped = v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const pattern = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    subject = subject.replace(pattern, v);
    htmlBody = htmlBody.replace(pattern, escaped);
  }

  const wrappedHtml = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background:#F7F8F7; padding:32px; color:#111312;">
      <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #E6E8E6; border-radius:16px; overflow:hidden;">
        <div style="background:#0D0F0E; color:#FFFFFF; padding:20px 28px; display:flex; align-items:center; justify-content:space-between;">
          <strong style="font-size:16px; letter-spacing:0.02em;">HELZERX PARTNERSHIPS</strong>
          <span style="color:#9EE855; font-size:12px;">Build Together. Grow Together.</span>
        </div>
        <div style="padding:28px; line-height:1.6; font-size:14px;">
          ${htmlBody}
        </div>
        <div style="padding:16px 28px; background:#F7F8F7; border-top:1px solid #E6E8E6; font-size:12px; color:#5A605C;">
          HelzerX Technologies Corporate Partnerships Portal · Automated Notification
        </div>
      </div>
    </div>
  `;

  return { subject, htmlBody: wrappedHtml };
}

export async function sendBrandedEmail(options: EmailDispatchOptions): Promise<void> {
  const db = getDb();
  const id = crypto.randomUUID();
  const from = process.env.SMTP_FROM || 'HelzerX Partnerships <partnerships@helzerx.example>';
  const transporter = getTransporter();

  let status = 'LOGGED_OUTBOX';
  let messageId: string | null = null;
  let errorMsg: string | null = null;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
      });
      status = 'SENT_SMTP';
      messageId = info.messageId || null;
    } catch (err: unknown) {
      status = 'FAILED_SMTP';
      errorMsg = err instanceof Error ? err.message : 'SMTP delivery error';
    }
  }

  db.prepare(`
    INSERT INTO email_outbox (id, recipient_email, template_key, subject, html_body, delivery_status, provider_message_id, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    options.to,
    options.templateKey || null,
    options.subject,
    options.htmlBody,
    status,
    messageId,
    errorMsg
  );
}
