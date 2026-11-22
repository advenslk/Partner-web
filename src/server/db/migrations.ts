import { getDb, withTransaction } from './database.ts';

interface Migration {
  version: string;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: '001',
    name: 'initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'PARTNER' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER', 'REVIEWER', 'PARTNER')),
        email_verified INTEGER NOT NULL DEFAULT 0,
        verification_token_hash TEXT,
        verification_expires_at TEXT,
        reset_token_hash TEXT,
        reset_expires_at TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
        notification_email INTEGER NOT NULL DEFAULT 1,
        notification_status_updates INTEGER NOT NULL DEFAULT 1,
        notification_messages INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        csrf_token TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        organization_type TEXT NOT NULL,
        country TEXT NOT NULL,
        website TEXT,
        description TEXT NOT NULL,
        year_established INTEGER,
        social_links_json TEXT NOT NULL DEFAULT '{}',
        logo_url TEXT,
        public_directory_approved INTEGER NOT NULL DEFAULT 0,
        public_category TEXT,
        collaboration_summary TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_orgs_owner ON organizations(owner_user_id);
      CREATE INDEX IF NOT EXISTS idx_orgs_public ON organizations(public_directory_approved);

      CREATE TABLE IF NOT EXISTS organization_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_role TEXT NOT NULL DEFAULT 'OWNER',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(organization_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS partnership_types (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        short_description TEXT NOT NULL,
        overview TEXT NOT NULL,
        objectives_json TEXT NOT NULL DEFAULT '[]',
        benefits_json TEXT NOT NULL DEFAULT '[]',
        expectations_json TEXT NOT NULL DEFAULT '[]',
        eligibility_json TEXT NOT NULL DEFAULT '[]',
        examples_json TEXT NOT NULL DEFAULT '[]',
        conditions_json TEXT NOT NULL DEFAULT '[]',
        comparison_attributes_json TEXT NOT NULL DEFAULT '{}',
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partnership_benefits (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL CHECK (category IN ('TECHNOLOGY', 'MARKETING', 'BUSINESS', 'COMMUNITY')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        availability_tier TEXT NOT NULL CHECK (availability_tier IN ('CONFIRMED', 'POTENTIAL', 'NEGOTIABLE')),
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partnership_requirements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'GENERAL',
        is_mandatory INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partner_applications (
        id TEXT PRIMARY KEY,
        reference_id TEXT NOT NULL UNIQUE,
        applicant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        partnership_type_slug TEXT NOT NULL REFERENCES partnership_types(slug),
        contact_person TEXT NOT NULL,
        contact_position TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        discord_username TEXT,
        phone_number TEXT,
        why_partner TEXT NOT NULL,
        what_can_offer TEXT NOT NULL,
        what_expect TEXT NOT NULL,
        objectives TEXT NOT NULL,
        resources_contributed TEXT NOT NULL,
        expected_duration TEXT NOT NULL,
        additional_info TEXT,
        source TEXT NOT NULL DEFAULT 'Direct Portal',
        status TEXT NOT NULL DEFAULT 'Submitted' CHECK (
          status IN (
            'Submitted',
            'Pending Review',
            'Under Review',
            'Additional Information Required',
            'Negotiation',
            'Approved',
            'Rejected',
            'Active',
            'Completed',
            'Cancelled'
          )
        ),
        assigned_manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        terms_accepted INTEGER NOT NULL DEFAULT 1,
        privacy_accepted INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_apps_status ON partner_applications(status);
      CREATE INDEX IF NOT EXISTS idx_apps_user ON partner_applications(applicant_user_id);
      CREATE INDEX IF NOT EXISTS idx_apps_org ON partner_applications(organization_id);
      CREATE INDEX IF NOT EXISTS idx_apps_type ON partner_applications(partnership_type_slug);

      CREATE TABLE IF NOT EXISTS application_status_history (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_app_hist_app ON application_status_history(application_id);

      CREATE TABLE IF NOT EXISTS partnerships (
        id TEXT PRIMARY KEY,
        application_id TEXT REFERENCES partner_applications(id) ON DELETE SET NULL,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        partnership_type_slug TEXT NOT NULL REFERENCES partnership_types(slug),
        manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Onboarding', 'Active', 'Renewal Due', 'Paused', 'Completed', 'Terminated')),
        benefits_json TEXT NOT NULL DEFAULT '[]',
        responsibilities_json TEXT NOT NULL DEFAULT '[]',
        start_date TEXT,
        renewal_date TEXT,
        end_date TEXT,
        progress_percent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES partner_applications(id) ON DELETE CASCADE,
        uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        category TEXT NOT NULL CHECK (category IN ('Company Profiles', 'Business Proposals', 'Partnership Agreements', 'NDAs', 'Supporting Documents', 'Official Correspondence')),
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        access_scope TEXT NOT NULL DEFAULT 'PARTNER_AND_ADMIN' CHECK (access_scope IN ('PARTNER_AND_ADMIN', 'ADMIN_ONLY')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS partnership_agreements (
        id TEXT PRIMARY KEY,
        partnership_id TEXT REFERENCES partnerships(id) ON DELETE SET NULL,
        application_id TEXT REFERENCES partner_applications(id) ON DELETE SET NULL,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        agreement_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Review', 'Sent for Signature', 'Executed', 'Archived')),
        effective_date TEXT,
        expiry_date TEXT,
        document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
        created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS document_audit_logs (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL CHECK (action IN ('UPLOAD', 'DOWNLOAD', 'VIEW', 'DELETE')),
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        application_id TEXT REFERENCES partner_applications(id) ON DELETE CASCADE,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(organization_id);

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'SYSTEM',
        link_path TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

      CREATE TABLE IF NOT EXISTS meeting_requests (
        id TEXT PRIMARY KEY,
        organization_name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        email TEXT NOT NULL,
        preferred_date TEXT NOT NULL,
        preferred_time TEXT NOT NULL,
        meeting_type TEXT NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rescheduled', 'Rejected', 'Completed')),
        meeting_link TEXT,
        admin_notes TEXT,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        handled_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        organization TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS admin_notes (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
        author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        actor_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details_json TEXT NOT NULL DEFAULT '{}',
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

      CREATE TABLE IF NOT EXISTS website_content (
        key TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        title TEXT NOT NULL,
        content_json TEXT NOT NULL,
        updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS faqs (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_published INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS email_templates (
        key TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_body TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS email_outbox (
        id TEXT PRIMARY KEY,
        recipient_email TEXT NOT NULL,
        template_key TEXT,
        subject TEXT NOT NULL,
        html_body TEXT NOT NULL,
        delivery_status TEXT NOT NULL DEFAULT 'QUEUED',
        provider_message_id TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];

export function runMigrations(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedStmt = db.prepare('SELECT version FROM schema_migrations');
  const applied = new Set((appliedStmt.all() as Array<{ version: string }>).map((r) => r.version));

  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      withTransaction(() => {
        db.exec(migration.sql);
        db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
          migration.version,
          migration.name
        );
      });
    }
  }
}
