export interface LegalSubsection {
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
}

export interface SeedLegalDocument {
  key: string;
  slug: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  legalReviewNotice: string;
  sortOrder: number;
  sections: LegalSection[];
}

const DRAFT_NOTICE =
  'DRAFT FOR LEGAL REVIEW: This document is a structured corporate first draft prepared for the HelzerX Corporate Partnerships Portal. It has not yet been formally certified by qualified legal counsel. Company registration particulars, governing jurisdiction, and statutory contact details remain configurable placeholders until verified and published by HelzerX leadership and legal advisors.';

export const SEED_LEGAL_DOCUMENTS: SeedLegalDocument[] = [
  {
    key: 'legal_privacy',
    slug: 'privacy',
    tabLabel: 'Privacy Policy',
    title: 'Privacy Policy',
    subtitle:
      'Governing how HelzerX Technologies collects, processes, stores, protects, and deletes personal and organizational information across the Corporate Partnerships Portal.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 1,
    sections: [
      {
        id: 'privacy-1',
        number: '1',
        title: 'Scope, Identity & Configurable Controller Details',
        paragraphs: [
          'This Privacy Policy describes the privacy practices of HelzerX Technologies ("HelzerX", "we", "our", or "us") in connection with the HelzerX Corporate Partnerships Portal, Partner Portal workspace, administrative review systems, and related communications.',
          'Entity particulars—including [Legal Entity Full Name — Configurable], [Company Registration Identifier — Configurable upon Registration], and [Registered Office Address — Configurable]—are maintained in portal configuration and will be finalized upon formal legal review.',
        ],
      },
      {
        id: 'privacy-2',
        number: '2',
        title: 'Information We Collect',
        paragraphs: [
          'We practice privacy-conscious data minimization and collect only the categories of information reasonably required to evaluate partnership proposals, manage partner relationships, secure portal access, and respond to inquiries.',
        ],
        subsections: [
          {
            number: '2.1',
            title: 'Personal & Representative Contact Information',
            paragraphs: [
              'When an individual registers an account, submits a partnership application, requests a meeting, or sends an inquiry, we collect business contact details provided directly by the user:',
            ],
            bullets: [
              'Full name, corporate role or position title, and business email address',
              'Optional messaging identifiers (such as Discord username) and business phone number',
              'Records of correspondence and messages exchanged inside the Partner Portal',
            ],
          },
          {
            number: '2.2',
            title: 'Partnership Application & Organization Information',
            paragraphs: [
              'During multi-step partnership submissions, we collect organizational and proposal materials necessary for commercial and technical evaluation:',
            ],
            bullets: [
              'Organization name, organization category, operating country or region, website URL, year established (optional), and public social links',
              'Partnership model selection, collaboration objectives, resource contribution summaries, expected duration, and answers to proposal questions',
              'Optional supporting files uploaded by the applicant (company profiles, business proposals, portfolios, and supporting attachments)',
            ],
          },
          {
            number: '2.3',
            title: 'Account & Authentication Information',
            paragraphs: [
              'For registered Partner Portal users and authorized HelzerX staff, we process account credentials and security metadata:',
            ],
            bullets: [
              'Salted cryptographic password hashes (passwords are never stored in plaintext)',
              'Email verification tokens, password reset tokens, session identifiers, and CSRF tokens',
              'Notification preferences (email alerts for status updates and portal messages)',
            ],
          },
          {
            number: '2.4',
            title: 'Technical & Audit Telemetry',
            paragraphs: [
              'To defend portal integrity and enforce role-based access control, our servers automatically record essential operational logs including IP addresses, browser user-agent strings on session creation, timestamps, and document access audit events.',
            ],
          },
        ],
      },
      {
        id: 'privacy-3',
        number: '3',
        title: 'How We Use Collected Information',
        paragraphs: ['HelzerX uses collected data strictly for legitimate partnership and operational purposes:'],
        bullets: [
          'Evaluating submitted partnership applications through our structured review workflow',
          'Generating unique application reference numbers and maintaining accurate status timelines',
          'Authenticating Partner Portal sessions and enforcing per-organization access isolation',
          'Scheduling requested discovery calls, technical briefings, and commercial reviews',
          'Delivering transactional notifications (account verification, application updates, meeting confirmations, and representative messages) in accordance with user preferences',
          'Maintaining immutable security audit logs and investigating suspected abuse or unauthorized access',
        ],
      },
      {
        id: 'privacy-4',
        number: '4',
        title: 'Data Storage, Protection & Security Safeguards',
        paragraphs: [
          'All application records, partner profiles, and uploaded files are stored within access-controlled environments. Uploaded documents are saved in private storage directories outside public web roots and are accessible solely through authenticated, permission-checked download routes.',
          'Administrative access is governed by strict least-privilege role separation (Super Admin, Admin, Partnership Manager, Reviewer, and Partner).',
        ],
      },
      {
        id: 'privacy-5',
        number: '5',
        title: 'Information Sharing & Third-Party Services',
        paragraphs: [
          'HelzerX does not sell, rent, or trade personal or organizational data to data brokers or advertising networks.',
        ],
        subsections: [
          {
            number: '5.1',
            title: 'Operational Service Providers',
            paragraphs: [
              'Where configured by portal administrators, specific operational functions may rely on third-party infrastructure providers (such as an external SMTP email delivery service or cloud hosting provider). Any such provider receives only the minimum data needed to execute the configured function.',
            ],
          },
          {
            number: '5.2',
            title: 'Public Partner Directory Disclosure',
            paragraphs: [
              'Applicant organizations are never listed publicly by default. An organization appears in the public Partner Directory only when explicitly approved by an authorized administrator with appropriate visibility settings.',
            ],
          },
          {
            number: '5.3',
            title: 'Legal & Compliance Disclosures',
            paragraphs: [
              'We may disclose limited information where reasonably required to comply with valid legal obligations, enforce our Terms of Service, or protect the security and rights of HelzerX, our partners, or the public.',
            ],
          },
        ],
      },
      {
        id: 'privacy-6',
        number: '6',
        title: 'Data Retention & Deletion Requests',
        paragraphs: [
          'We retain personal and application data only for as long as needed to evaluate proposals, administer active partnerships, satisfy audit integrity, or comply with configurable portal retention policies (default configurable window: 730 days for closed applications, adjustable in System Settings).',
          'Authorized representatives may request deletion or export of their organization records or personal account data, subject to legal hold obligations or active contractual record-keeping requirements.',
        ],
      },
      {
        id: 'privacy-7',
        number: '7',
        title: 'User Rights & Consent Controls',
        paragraphs: ['Depending on applicable jurisdiction, individuals may exercise the following rights:'],
        bullets: [
          'Access & Review: View submitted applications, organization profile fields, and uploaded documents via the Partner Portal',
          'Correction: Update permitted organization and contact details directly in Partnership Profile or Account Settings',
          'Notification Opt-Out: Disable optional email notifications for status changes and messages in Account Settings',
          'Deletion & Withdrawal: Withdraw pending applications or submit a formal erasure request via our privacy contact procedure',
        ],
      },
      {
        id: 'privacy-8',
        number: '8',
        title: 'Contact Procedures for Privacy Inquiries',
        paragraphs: [
          'Questions, data access requests, or deletion requests may be directed to our configurable privacy desk at [Privacy Contact Email — Configurable, e.g., partnerships@helzerx.example] or submitted through the portal Contact page.',
        ],
      },
    ],
  },
  {
    key: 'legal_terms',
    slug: 'terms',
    tabLabel: 'Terms of Service',
    title: 'Terms of Service',
    subtitle:
      'Governing access to and use of the HelzerX Corporate Partnerships website, application workflows, and authenticated Partner Portal.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 2,
    sections: [
      {
        id: 'terms-1',
        number: '1',
        title: 'Acceptance of Terms & Scope',
        paragraphs: [
          'By accessing the HelzerX Corporate Partnerships Portal ("Portal"), submitting a partnership proposal, requesting a briefing, or creating a partner account, you agree to be bound by these Terms of Service ("Terms") on behalf of yourself and the organization you represent.',
          'If you do not agree to these Terms, or if you lack authority to bind your organization, you must discontinue use of the Portal immediately.',
        ],
      },
      {
        id: 'terms-2',
        number: '2',
        title: 'Eligibility & Organizational Authority',
        paragraphs: [
          'Use of the Portal for partnership submissions is intended strictly for business, community, academic, or creator representatives who are legally capable of entering into discussions or agreements in their jurisdiction.',
          'By submitting information on behalf of an organization, you represent that all submitted organizational descriptions, contact details, and supporting files are truthful and that you are authorized to submit them.',
        ],
      },
      {
        id: 'terms-3',
        number: '3',
        title: 'Account & Session Responsibilities',
        paragraphs: ['Registered Partner Portal users are responsible for maintaining the confidentiality and security of their accounts:'],
        bullets: [
          'Provide accurate registration information and complete email verification when prompted',
          'Maintain strong, unique passwords and refrain from sharing login credentials across unauthorized personnel',
          'Notify HelzerX immediately if you suspect unauthorized access, session compromise, or credential leakage',
          'Ensure that all actions performed under your authenticated account comply with these Terms and our Acceptable Use Policy',
        ],
      },
      {
        id: 'terms-4',
        number: '4',
        title: 'Website Usage & Non-Binding Application Status',
        paragraphs: [
          'Submitting a partnership application or scheduling an introductory meeting does not create a partnership, joint venture, agency relationship, employment relationship, or binding commercial obligation between your organization and HelzerX.',
          'HelzerX evaluates proposals at its sole discretion and reserves the right to request additional information, propose modifications, approve, or decline any application without obligation.',
        ],
      },
      {
        id: 'terms-5',
        number: '5',
        title: 'Prohibited Activities',
        paragraphs: ['While using the Portal, users must not engage in any prohibited behavior, including:'],
        bullets: [
          'Attempting to bypass authentication, CSRF protections, rate limits, or role-based access controls',
          'Accessing or attempting to inspect applications, documents, or messages belonging to other organizations',
          'Uploading malware, executable scripts disguised as documents, or deceptive materials',
          'Scraping, automated harvesting, or denial-of-service interference with Portal infrastructure',
          'Falsifying company identities, certifications, endorsements, or partnership status with HelzerX',
        ],
      },
      {
        id: 'terms-6',
        number: '6',
        title: 'Intellectual Property Rights',
        paragraphs: [
          'All Portal software, layout structures, original text, graphics, and HelzerX trademarks (including HelzerX Technologies, HelzerX Cloud, HelzerX Studio, HelzerX Shop, and HelzerX Solutions) remain the exclusive property of HelzerX or its licensors.',
          'Applicants retain ownership of proprietary materials and company profiles they upload, granting HelzerX a limited, non-exclusive license to store, copy internally, and review such materials solely for evaluating and administering the proposed partnership.',
        ],
      },
      {
        id: 'terms-7',
        number: '7',
        title: 'Disclaimers & Availability',
        paragraphs: [
          'The Portal and informational materials are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.',
          'Descriptions of potential or negotiable partnership benefits represent general collaboration frameworks rather than guaranteed entitlements.',
        ],
      },
      {
        id: 'terms-8',
        number: '8',
        title: 'Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by applicable law, HelzerX Technologies and its directors, officers, employees, and representatives shall not be liable for any indirect, incidental, consequential, special, or punitive damages, or loss of profits, revenue, data, or business opportunity arising from your use of or inability to use the Portal.',
          'Where liability cannot be excluded by law, aggregate liability relating to Portal usage shall be limited to [Configurable Liability Cap — Pending Legal Counsel Review].',
        ],
      },
      {
        id: 'terms-9',
        number: '9',
        title: 'Service Modifications & Account Termination',
        paragraphs: [
          'HelzerX may update Portal features, modify partnership categories, or suspend application intake at any time. We reserve the right to suspend or terminate Portal accounts that violate these Terms, fail verification requirements, or remain inactive beyond retention windows.',
        ],
      },
      {
        id: 'terms-10',
        number: '10',
        title: 'Dispute Resolution & Governing Law',
        paragraphs: [
          'Before initiating formal proceedings, parties agree to make good-faith efforts to resolve Portal disputes informally through written notice to [Dispute Contact Email — Configurable].',
          'These Terms are intended to be governed by the laws of [Governing Jurisdiction — Configurable upon Legal Review], without regard to conflict-of-law principles.',
        ],
      },
    ],
  },
  {
    key: 'legal_partnership_terms',
    slug: 'partnership-terms',
    tabLabel: 'Partnership Terms',
    title: 'Corporate Partnership Terms',
    subtitle:
      'Framework terms governing partnership eligibility, application review, mutual responsibilities, benefit tiers, commercial arrangements, and termination.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 3,
    sections: [
      {
        id: 'pt-1',
        number: '1',
        title: 'Relationship to Executed Partnership Agreements',
        paragraphs: [
          'These Partnership Terms outline the baseline governance framework for collaborations across HelzerX Cloud, HelzerX Studio, HelzerX Shop, and HelzerX Solutions. Specific commercial rights, deliverables, SLAs, and financial schedules become legally binding only upon execution of a dedicated written Partnership Agreement or Statement of Work.',
        ],
      },
      {
        id: 'pt-2',
        number: '2',
        title: 'Partnership Eligibility & Application Procedures',
        paragraphs: [
          'Organizations seeking Strategic, Technology, Marketing, Community, Affiliate, Sponsorship, Service Exchange, or Custom partnerships must submit accurate profiles and proposals via the Portal.',
        ],
        subsections: [
          {
            number: '2.1',
            title: 'Evaluation & Workflow Stages',
            paragraphs: [
              'Applications pass through structured evaluation statuses—Submitted, Pending Review, Under Review, Additional Information Required, Negotiation, Approved, Rejected, Active, Completed, or Cancelled—recorded with timestamps in the Partner Portal.',
            ],
          },
          {
            number: '2.2',
            title: 'No Automatic Approval',
            paragraphs: [
              'Meeting baseline eligibility criteria qualifies an organization for evaluation but does not guarantee acceptance, infrastructure allocation, or commercial endorsement.',
            ],
          },
        ],
      },
      {
        id: 'pt-3',
        number: '3',
        title: 'Partner Responsibilities',
        paragraphs: ['Approved partners are expected to uphold consistent operational and ethical standards:'],
        bullets: [
          'Maintain designated, responsive points of contact inside the Partner Portal',
          'Execute agreed deliverables, milestones, and technical integrations within documented timelines',
          'Report referral attributions, event outcomes, or technical incidents transparently and accurately',
          'Comply with all applicable laws, privacy obligations, and ethical business practices',
        ],
      },
      {
        id: 'pt-4',
        number: '4',
        title: 'HelzerX Responsibilities',
        paragraphs: ['For active partnerships under executed agreements, HelzerX commits to:'],
        bullets: [
          'Assigning an authorized Partnership Manager or reviewer point of contact',
          'Providing agreed portal access, technical coordination, or confirmed baseline resources',
          'Reviewing co-marketing assets promptly and maintaining accurate partner records',
          'Protecting partner confidential submissions under agreed security and NDA controls',
        ],
      },
      {
        id: 'pt-5',
        number: '5',
        title: 'Benefits, Potential Offerings & Negotiable Terms',
        paragraphs: [
          'Benefits displayed on the Portal are explicitly categorized as Confirmed (baseline features for approved partners), Potential (available depending on partnership track and qualification), or Negotiable (custom-scoped during Negotiation).',
          'HelzerX makes no blanket guarantee of hosting credits, financial sponsorship, or dedicated engineering allocations absent written confirmation in an executed Schedule.',
        ],
      },
      {
        id: 'pt-6',
        number: '6',
        title: 'Financial Arrangements, Affiliates & Revenue Sharing',
        paragraphs: [
          'Any commission rates, affiliate payouts, sponsorship disbursements, or revenue-sharing splits are governed exclusively by written Commercial Schedules signed by authorized officers of both parties.',
          'No percentage, fixed fee, or minimum payout is established by the Portal itself. Taxes, invoicing procedures, payout thresholds, and currency rules are specified per executed agreement.',
        ],
      },
      {
        id: 'pt-7',
        number: '7',
        title: 'Confidentiality & Branding Permissions',
        paragraphs: [
          'Neither party may issue press releases, display the other party’s trademarks, or imply joint endorsement without prior written brand approval.',
          'All non-public technical architecture, pricing, and commercial proposals remain subject to confidentiality obligations and any executed Mutual NDA.',
        ],
      },
      {
        id: 'pt-8',
        number: '8',
        title: 'Duration, Renewal, Termination & Disputes',
        paragraphs: [
          'Agreement duration (such as pilot terms, annual cycles, or project-specific engagements) and renewal review dates are tracked in the Partner Portal and governed by the applicable Agreement.',
          'Either party may terminate a partnership for convenience upon the notice period stated in the executed Agreement, or immediately for material breach, reputational harm, fraud, or breach of Acceptable Use standards.',
          'Disputes shall first undergo structured executive escalation between Partnership Managers for [Escalation Period — Configurable, e.g., 30 days] prior to formal mediation or legal proceedings in [Governing Jurisdiction — Configurable].',
        ],
      },
    ],
  },
  {
    key: 'legal_aup',
    slug: 'aup',
    tabLabel: 'Acceptable Use',
    title: 'Acceptable Use Policy',
    subtitle:
      'Standards of lawful, ethical, and secure conduct governing all visitors, applicants, portal accounts, and active HelzerX partners.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 4,
    sections: [
      {
        id: 'aup-1',
        number: '1',
        title: 'Scope & Applicability',
        paragraphs: [
          'This Acceptable Use Policy ("AUP") applies to every visitor, applicant, Partner Portal user, and partner organization interacting with HelzerX websites, APIs, document storage, community spaces, or division infrastructure (Cloud, Studio, Shop, Solutions).',
        ],
      },
      {
        id: 'aup-2',
        number: '2',
        title: 'Permitted Business & Collaboration Use',
        paragraphs: [
          'Users may utilize the Portal solely for legitimate partnership discovery, application submission, document exchange, meeting scheduling, and authorized partnership management.',
        ],
      },
      {
        id: 'aup-3',
        number: '3',
        title: 'Fraud, Impersonation & Deceptive Conduct',
        paragraphs: ['The following deceptive practices are strictly prohibited:'],
        bullets: [
          'Impersonating another business, public figure, community leader, or HelzerX staff member',
          'Submitting fabricated company registrations, false ownership claims, or falsified portfolio work',
          'Generating fraudulent affiliate clicks, self-referrals, cookie stuffing, or misleading promotional pricing claims',
          'Misrepresenting an application or pending review as an active endorsement or official partnership',
        ],
      },
      {
        id: 'aup-4',
        number: '4',
        title: 'Harassment, Abuse & Harmful Content',
        paragraphs: [
          'HelzerX maintains zero tolerance for abusive behavior across portal messages, meetings, and partnered community events. Users must not transmit threats, discriminatory harassment, hate speech, defamatory statements, or unlawful content.',
        ],
      },
      {
        id: 'aup-5',
        number: '5',
        title: 'Malicious Technical Activities & Unauthorized Access',
        paragraphs: ['Users are strictly prohibited from engaging in any cyber-abuse or technical interference:'],
        bullets: [
          'Probing, scanning, or testing Portal vulnerabilities without explicit written authorization from HelzerX',
          'Attempting SQL injection, cross-site scripting (XSS), session hijacking, CSRF bypass, or brute-force credential attacks',
          'Uploading viruses, trojans, ransomware, polyglot files, or executable payloads in application upload slots',
          'Attempting to enumerate or retrieve documents, messages, or records belonging to other partners',
        ],
      },
      {
        id: 'aup-6',
        number: '6',
        title: 'Misuse of HelzerX Division Resources',
        paragraphs: [
          'Any sandbox compute, game hosting capacity, API credentials, or promotional codes provided under an approved partnership may only be used for the explicitly approved scope. Unauthorized cryptomining, DDoS amplification, spam relay, or unauthorized resale is grounds for immediate revocation.',
        ],
      },
      {
        id: 'aup-7',
        number: '7',
        title: 'Reporting, Investigation & Enforcement',
        paragraphs: [
          'Suspected violations of this AUP should be reported immediately via [Abuse/Security Contact Email — Configurable] or the Portal Contact form.',
          'HelzerX may immediately suspend portal access, reject pending proposals, terminate active agreements, and preserve audit evidence for legal authorities where necessary.',
        ],
      },
    ],
  },
  {
    key: 'legal_data_handling',
    slug: 'data-handling',
    tabLabel: 'Data Handling',
    title: 'Data Handling & Security Policy',
    subtitle:
      'Operational standards governing how HelzerX ingests, segregates, stores, audits, retains, and protects partner records and confidential documents.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 5,
    sections: [
      {
        id: 'dh-1',
        number: '1',
        title: 'Purpose & Governance Principles',
        paragraphs: [
          'This Data Handling Policy outlines the technical and organizational safeguards HelzerX applies to protect information entrusted by applicants and partners throughout the partnership lifecycle.',
        ],
      },
      {
        id: 'dh-2',
        number: '2',
        title: 'Classification of Partner Information',
        paragraphs: ['Portal information is classified into distinct sensitivity tiers:'],
        bullets: [
          'Public Directory Data: Only organization names, descriptions, and links explicitly approved by administrators for public display',
          'Restricted Partner Data: Application proposals, contact details, portal messages, and meeting schedules segregated per organization',
          'Confidential Legal & Technical Files: Uploaded proposals, company profiles, NDAs, and executed agreements stored in private vaults',
          'Internal Governance Data: Reviewer notes, status change justifications, and security audit trails invisible to external partners',
        ],
      },
      {
        id: 'dh-3',
        number: '3',
        title: 'Private Document Storage & Upload Controls',
        paragraphs: [
          'Files submitted during Step 5 of the Partnership Application or uploaded in the Partner Portal undergo strict server-side validation:',
        ],
        bullets: [
          'Allowlisted file extensions and MIME types (PDF, DOC/DOCX, PNG, JPG, TXT, ZIP) with enforced 10 MB per-file size caps',
          'Randomized server-assigned filenames stored inside a private directory completely isolated from static web serving',
          'Authenticated, permission-verified download streams rather than guessable or public URLs',
        ],
      },
      {
        id: 'dh-4',
        number: '4',
        title: 'Authentication & Session Protection',
        paragraphs: [
          'User credentials are hashed with industry-standard salted bcrypt hashing. Active sessions use cryptographically signed HTTP-only cookies paired with server-side session expiration and CSRF token verification on state-changing requests.',
        ],
      },
      {
        id: 'dh-5',
        number: '5',
        title: 'Role-Based Access Control (RBAC) & Tenant Isolation',
        paragraphs: [
          'Backend APIs enforce authorization checks on every request rather than relying on client-side routing:',
        ],
        bullets: [
          'Partner accounts are strictly scoped to their own organization IDs and user IDs and cannot query other partners’ records',
          'Reviewers and Partnership Managers access only operational queues permitted by their assigned roles',
          'Super Admins control role elevation, system settings, and security configuration',
        ],
      },
      {
        id: 'dh-6',
        number: '6',
        title: 'Audit Logging & Accountability',
        paragraphs: [
          'All sensitive operations—including logins, role modifications, application status changes, document uploads, document downloads, and CMS edits—are recorded in immutable audit logs capturing actor identity, timestamps, and network metadata.',
        ],
      },
      {
        id: 'dh-7',
        number: '7',
        title: 'Retention, Secure Disposal & Incident Response',
        paragraphs: [
          'Closed or rejected applications are retained only for the configured portal retention window unless legal or audit obligations require extended preservation. Upon validated deletion requests, associated records and private disk files are purged systematically.',
          'In the event of a confirmed security incident affecting partner data, HelzerX will contain the issue, review audit trails, assess impact, and notify affected organization contacts promptly in accordance with applicable legal obligations.',
        ],
      },
    ],
  },
  {
    key: 'legal_cookies',
    slug: 'cookies',
    tabLabel: 'Cookie Policy',
    title: 'Cookie & Session Technology Policy',
    subtitle:
      'Detailed explanation of how HelzerX uses essential session cookies, security tokens, and preference controls across the Partnerships Portal.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 6,
    sections: [
      {
        id: 'ck-1',
        number: '1',
        title: 'Overview of Cookies & Storage Technologies',
        paragraphs: [
          'Cookies are small text files stored by your browser when visiting websites. HelzerX follows a minimal-cookie architecture focused strictly on security, authentication integrity, and core portal usability.',
        ],
      },
      {
        id: 'ck-2',
        number: '2',
        title: 'Strictly Necessary & Authentication Cookies',
        paragraphs: ['The following essential mechanisms are required for the Partner Portal and Admin Console to operate safely:'],
        bullets: [
          'hx_session (HTTP-Only Signed Session Cookie): Maintains your authenticated session securely without exposing session tokens to client-side JavaScript or localStorage',
          'CSRF Protection Tokens: Server-bound tokens transmitted via request headers to protect authenticated actions against Cross-Site Request Forgery',
        ],
      },
      {
        id: 'ck-3',
        number: '3',
        title: 'Functional Preferences',
        paragraphs: [
          'Temporary in-memory state and minimal UI states (such as multi-step application navigation or comparison table filters) operate locally during your active visit to ensure smooth form completion.',
        ],
      },
      {
        id: 'ck-4',
        number: '4',
        title: 'Analytics & Third-Party Cookies',
        paragraphs: [
          'By default, the HelzerX Corporate Partnerships Portal does not deploy invasive third-party advertising cookies, cross-site behavioral trackers, or ad-retargeting pixels. All admin analytics are computed directly from first-party database records.',
          'If optional third-party analytics or embedded scheduling integrations are enabled by administrators in the future, this Policy will be updated and non-essential cookies will be gated behind explicit consent.',
        ],
      },
      {
        id: 'ck-5',
        number: '5',
        title: 'Managing Browser Cookies & Consent',
        paragraphs: [
          'Because hx_session is strictly necessary for authenticated portal security, blocking all cookies in your browser will prevent signing in to the Partner Portal or Admin Console. Public informational pages remain readable even with cookies disabled.',
          'You may clear cookies at any time via your browser privacy settings or sign out directly from the Portal to terminate your server session immediately.',
        ],
      },
    ],
  },
  {
    key: 'legal_nda',
    slug: 'nda',
    tabLabel: 'NDA Information',
    title: 'Non-Disclosure & Confidentiality Information',
    subtitle:
      'Guidance on how confidential proposals, technical architecture, and mutual NDA workflows operate during HelzerX partnership evaluations.',
    version: '1.0-draft',
    status: 'DRAFT',
    legalReviewNotice: DRAFT_NOTICE,
    sortOrder: 7,
    sections: [
      {
        id: 'nda-1',
        number: '1',
        title: 'Purpose of Confidentiality Governance',
        paragraphs: [
          'Meaningful technical and strategic partnerships often require sharing sensitive architectural diagrams, product roadmaps, commercial structures, or security documentation. This notice explains how HelzerX treats confidential information prior to and under formal Non-Disclosure Agreements (NDAs).',
        ],
      },
      {
        id: 'nda-2',
        number: '2',
        title: 'Initial Applications vs. Formal Mutual NDA',
        paragraphs: [
          'Applicants are advised not to include unredacted trade secrets, source code, or regulated personal customer data in initial public-intake fields. Initial applications are protected under our Data Handling Policy, while formal Mutual NDAs are initiated during the Under Review or Negotiation stages prior to deep technical or financial exchange.',
        ],
      },
      {
        id: 'nda-3',
        number: '3',
        title: 'Scope of Confidential Information',
        paragraphs: ['Under a standard HelzerX Mutual NDA, "Confidential Information" generally encompasses:'],
        bullets: [
          'Non-public software architecture, infrastructure topologies, API specifications, and security documentation',
          'Commercial proposals, pricing schedules, revenue-sharing structures, and unpublished product roadmaps',
          'Materials explicitly designated as "Confidential" or reasonably understood to be proprietary given their nature',
        ],
      },
      {
        id: 'nda-4',
        number: '4',
        title: 'Protection Obligations & Permitted Disclosures',
        paragraphs: [
          'Each receiving party must safeguard Confidential Information using at least the same degree of care it applies to its own proprietary information (and never less than reasonable care).',
          'Disclosures are permitted solely to employees, contractors, legal counsel, or authorized reviewers who have a strict need to know and are bound by equivalent confidentiality obligations, or where compelled by valid court or regulatory order following prompt prior notice where legally permissible.',
        ],
      },
      {
        id: 'nda-5',
        number: '5',
        title: 'Standard Exclusions',
        paragraphs: ['Confidentiality obligations do not apply to information that:'],
        bullets: [
          'Is or becomes publicly available through no breach by the receiving party',
          'Was rightfully known to the receiving party prior to disclosure without confidentiality restrictions',
          'Is independently developed without reference to the disclosing party’s Confidential Information',
          'Is rightfully obtained from a third party free of confidentiality obligations',
        ],
      },
      {
        id: 'nda-6',
        number: '6',
        title: 'Duration & Post-Partnership Obligations',
        paragraphs: [
          'Standard NDA confidentiality obligations typically survive for [Survival Duration — Configurable, e.g., three (3) to five (5) years] following expiration or termination of evaluation discussions or partnership agreements, or indefinitely for qualifying trade secrets where specified in the executed NDA.',
          'Upon written request at the conclusion of discussions, confidential documents and copies must be promptly returned or securely destroyed in accordance with the executed agreement.',
        ],
      },
    ],
  },
];
