import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb, withTransaction } from './database.ts';
import { SEED_LEGAL_DOCUMENTS } from './legalSeedData.ts';

function uuid(): string {
  return crypto.randomUUID();
}

export function ensureLegalDocumentsSeeded(): void {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM legal_documents').get() as {
    count: number;
  };
  if (countRow.count >= SEED_LEGAL_DOCUMENTS.length) {
    return;
  }

  withTransaction(() => {
    const upsertDoc = db.prepare(`
      INSERT INTO legal_documents (
        key, slug, tab_label, title, subtitle, version, status, legal_review_notice,
        published_at, last_updated_at, sections_json,
        draft_title, draft_subtitle, draft_version, draft_legal_review_notice, draft_sections_json,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO NOTHING
    `);

    const insertVer = db.prepare(`
      INSERT INTO legal_document_versions (
        id, document_key, version, status, title, subtitle, legal_review_notice, sections_json, change_note, created_by_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const doc of SEED_LEGAL_DOCUMENTS) {
      const sectionsJson = JSON.stringify(doc.sections);
      const info = upsertDoc.run(
        doc.key,
        doc.slug,
        doc.tabLabel,
        doc.title,
        doc.subtitle,
        doc.version,
        doc.status,
        doc.legalReviewNotice,
        sectionsJson,
        doc.title,
        doc.subtitle,
        doc.version,
        doc.legalReviewNotice,
        sectionsJson,
        doc.sortOrder
      );

      if (info.changes > 0) {
        insertVer.run(
          uuid(),
          doc.key,
          doc.version,
          doc.status,
          doc.title,
          doc.subtitle,
          doc.legalReviewNotice,
          sectionsJson,
          'Initial structured corporate legal draft created.',
          'system@helzerx.com'
        );
      }
    }
  });
}

export function seedDatabaseIfEmpty(): void {
  const db = getDb();
  ensureLegalDocumentsSeeded();

  const existingTypes = db.prepare('SELECT COUNT(*) as count FROM partnership_types').get() as {
    count: number;
  };
  if (existingTypes.count > 0) {
    return;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@helzerx.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'HelzerX!Admin2026';
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const partnerHash = bcrypt.hashSync('Partner!2026', 10);

  const adminId = uuid();
  const managerId = uuid();
  const partnerUserId = uuid();
  const orgId = uuid();
  const appId = uuid();

  withTransaction(() => {
    // 1. Seed Users (Super Admin, Partnership Manager, Demo Partner)
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, email_verified, status)
      VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE')
    `);
    insertUser.run(adminId, adminEmail, adminHash, 'HelzerX Principal Administrator', 'SUPER_ADMIN');
    insertUser.run(managerId, 'alliances@helzerx.com', adminHash, 'Elena Vance', 'PARTNERSHIP_MANAGER');
    insertUser.run(partnerUserId, 'partner@example-org.test', partnerHash, 'Marcus Sterling', 'PARTNER');

    // 2. Seed Partnership Types (8 official types)
    const insertType = db.prepare(`
      INSERT INTO partnership_types (
        id, slug, code, name, short_description, overview,
        objectives_json, benefits_json, expectations_json, eligibility_json,
        examples_json, conditions_json, comparison_attributes_json, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const types = [
      {
        slug: 'strategic',
        code: '01',
        name: 'Strategic Partnership',
        short_description: 'Long-term business collaboration.',
        overview:
          'Designed for established enterprises, technology vendors, and multi-disciplinary organizations seeking structured, multi-quarter alignment across infrastructure, engineering, and market expansion.',
        objectives: [
          'Align multi-year product and infrastructure roadmaps where mutually beneficial.',
          'Co-develop high-value enterprise solutions across HelzerX Cloud and Solutions.',
          'Establish joint governance, executive sponsorship, and transparent performance reviews.',
        ],
        benefits: [
          'Dedicated Partnership Manager and executive review cadence',
          'Priority evaluation for joint enterprise proposals and technical integrations',
          'Custom commercial framework tailored to shared scope',
          'Eligibility for approved Partner Directory spotlight listing',
        ],
        expectations: [
          'Designated executive point of contact and structured quarterly reviews',
          'Clear legal and operational readiness under mutual NDA',
          'Documented delivery standards and ethical business conduct',
        ],
        eligibility: [
          'Registered business entity or established operating organization',
          'Demonstrable track record in technology, digital services, or enterprise operations',
          'Alignment with at least one HelzerX business division',
        ],
        examples: [
          'Multi-region cloud infrastructure capacity and managed services alliance',
          'Joint enterprise software delivery combining HelzerX Solutions with domain specialists',
        ],
        conditions: [
          'All commercial commitments require written execution of a formal Strategic Partnership Agreement.',
          'Benefits marked Negotiable are scoped individually during the Negotiation stage.',
        ],
        comparison: {
          brandPromotion: 'Available',
          technicalCollaboration: 'Available',
          infrastructureAccess: 'Negotiable',
          revenueSharing: 'Negotiable',
          jointProjects: 'Available',
          communityExposure: 'Optional',
          marketingSupport: 'Available',
          longTermCollaboration: 'Available',
          customAgreements: 'Available',
        },
        sort: 1,
      },
      {
        slug: 'technology',
        code: '02',
        name: 'Technology Partnership',
        short_description: 'Technical integration, infrastructure collaboration, and software development.',
        overview:
          'Built for software engineering firms, hosting providers, API platforms, and infrastructure teams collaborating directly with HelzerX Cloud and HelzerX Solutions on integrations, automation, and architecture.',
        objectives: [
          'Integrate complementary software platforms, APIs, or hosting stacks.',
          'Validate technical interoperability and security standards prior to deployment.',
          'Share engineering knowledge and architecture documentation safely.',
        ],
        benefits: [
          'Sandbox evaluation access on HelzerX Cloud infrastructure (subject to review)',
          'Direct technical coordination with HelzerX engineering leads',
          'Co-authored integration documentation and joint technical briefs',
          'Optional commercial referral or solution bundling terms',
        ],
        expectations: [
          'Maintained technical documentation and responsible security disclosure practices',
          'Reliable uptime and responsive engineering support during joint deployments',
          'Compliance with HelzerX data handling and API security standards',
        ],
        eligibility: [
          'Active software product, developer tool, or infrastructure service',
          'Dedicated technical contact able to collaborate on integration milestones',
        ],
        examples: [
          'Automated game server provisioning panel integrated with HelzerX Cloud nodes',
          'Business workflow automation connector deployed via HelzerX Solutions',
        ],
        conditions: [
          'Infrastructure access is provisioned only after technical security review.',
          'Intellectual property ownership remains explicitly governed by the executed agreement.',
        ],
        comparison: {
          brandPromotion: 'Optional',
          technicalCollaboration: 'Available',
          infrastructureAccess: 'Available',
          revenueSharing: 'Negotiable',
          jointProjects: 'Available',
          communityExposure: 'Optional',
          marketingSupport: 'Optional',
          longTermCollaboration: 'Available',
          customAgreements: 'Negotiable',
        },
        sort: 2,
      },
      {
        slug: 'marketing',
        code: '03',
        name: 'Marketing Partnership',
        short_description: 'Joint marketing, promotional campaigns, advertising, and brand awareness.',
        overview:
          'Structured for digital agencies, media networks, creative studios, and complementary brands aiming to execute coordinated campaigns, co-branded announcements, and audience growth initiatives.',
        objectives: [
          'Expand qualified reach across complementary technology and creative audiences.',
          'Coordinate product launch announcements, webinars, and editorial content.',
          'Maintain consistent, accurate brand representation across channels.',
        ],
        benefits: [
          'Co-branded campaign assets produced in alignment with HelzerX Studio guidelines',
          'Cross-channel social media and announcement coordination',
          'Access to verified campaign landing pages and referral tracking links',
        ],
        expectations: [
          'Pre-publication review of co-branded copy and visual assets',
          'Honest, non-misleading promotional claims without unverified metrics',
          'Clear campaign calendar and post-campaign summary sharing',
        ],
        eligibility: [
          'Active marketing channel, agency portfolio, or established brand presence',
          'Brand standards compatible with HelzerX corporate guidelines',
        ],
        examples: [
          'Co-hosted technical showcase featuring HelzerX Studio web engineering',
          'Cross-promotional bundle across digital products and creative templates',
        ],
        conditions: [
          'Use of HelzerX trademarks requires written brand guidelines adherence.',
          'Paid advertising budgets, if any, are approved per campaign brief.',
        ],
        comparison: {
          brandPromotion: 'Available',
          technicalCollaboration: 'Not Included',
          infrastructureAccess: 'Not Included',
          revenueSharing: 'Optional',
          jointProjects: 'Optional',
          communityExposure: 'Available',
          marketingSupport: 'Available',
          longTermCollaboration: 'Optional',
          customAgreements: 'Optional',
        },
        sort: 3,
      },
      {
        slug: 'community',
        code: '04',
        name: 'Community Partnership',
        short_description: 'Gaming communities, Discord servers, community events, and audience collaboration.',
        overview:
          'Tailored for gaming networks, developer guilds, Discord communities, esports organizers, and creator collectives looking to collaborate on community events, hosting initiatives, and member perks.',
        objectives: [
          'Support healthy, well-moderated digital and gaming communities.',
          'Collaborate on tournaments, community build-offs, and educational workshops.',
          'Provide members with reliable infrastructure or digital resources where approved.',
        ],
        benefits: [
          'Community event support and promotional spotlight opportunities',
          'Potential game hosting or community server resources via HelzerX Cloud',
          'Discord cross-collaboration and verified partner announcements',
          'Optional member-exclusive codes for HelzerX Shop or Cloud services',
        ],
        expectations: [
          'Active community moderation and clear code-of-conduct enforcement',
          'Transparent communication around event schedules and deliverable timelines',
          'Respectful representation of the HelzerX brand within community spaces',
        ],
        eligibility: [
          'Active, engaged community with verifiable leadership and moderation structure',
          'Zero tolerance for harassment, illicit content, or deceptive promotions',
        ],
        examples: [
          'Seasonal community gaming tournament hosted on HelzerX Cloud infrastructure',
          'Developer community hackathon co-sponsored with digital product credits',
        ],
        conditions: [
          'Hosting resource grants are subject to periodic utilization and conduct review.',
          'Community partnerships are reviewed quarterly for mutual engagement.',
        ],
        comparison: {
          brandPromotion: 'Available',
          technicalCollaboration: 'Optional',
          infrastructureAccess: 'Negotiable',
          revenueSharing: 'Optional',
          jointProjects: 'Optional',
          communityExposure: 'Available',
          marketingSupport: 'Available',
          longTermCollaboration: 'Available',
          customAgreements: 'Optional',
        },
        sort: 4,
      },
      {
        slug: 'affiliate',
        code: '05',
        name: 'Affiliate Partnership',
        short_description: 'Referral tracking, affiliate links, and commission-based collaboration.',
        overview:
          'Performance-aligned referral collaboration for publishers, technical educators, consultants, and digital creators introducing qualified organizations to HelzerX Cloud, Studio, Shop, or Solutions.',
        objectives: [
          'Establish transparent, auditable referral attribution for qualified leads.',
          'Reward consistent partner advocacy with documented commission schedules.',
          'Ensure referred clients receive accurate pre-sales expectations.',
        ],
        benefits: [
          'Dedicated referral tracking codes and attribution reporting',
          'Commission structure defined per division and product category',
          'Approved promotional copy and media kit access',
        ],
        expectations: [
          'Accurate disclosure of affiliate relationships per applicable regulations',
          'No spam, brand-bidding abuse, or misleading pricing claims',
          'Verified payout details and compliance documentation',
        ],
        eligibility: [
          'Content platform, advisory practice, or technical audience relevant to HelzerX divisions',
          'Agreement to HelzerX Affiliate & Acceptable Use Terms',
        ],
        examples: [
          'Technical educator recommending HelzerX Cloud hosting tutorials with tracked referral links',
          'Digital consultant referring e-commerce clients to HelzerX Shop and Studio',
        ],
        conditions: [
          'Commission rates and payout thresholds are governed solely by the approved Affiliate Schedule.',
          'Self-referrals and fraudulent traffic result in immediate termination.',
        ],
        comparison: {
          brandPromotion: 'Optional',
          technicalCollaboration: 'Not Included',
          infrastructureAccess: 'Not Included',
          revenueSharing: 'Available',
          jointProjects: 'Not Included',
          communityExposure: 'Optional',
          marketingSupport: 'Available',
          longTermCollaboration: 'Optional',
          customAgreements: 'Not Included',
        },
        sort: 5,
      },
      {
        slug: 'sponsorship',
        code: '06',
        name: 'Sponsorship Partnership',
        short_description: 'Event sponsorship, project sponsorship, and promotional sponsorship.',
        overview:
          'Structured sponsorship collaboration for conferences, open-source initiatives, digital media series, esports circuits, and technical summits seeking infrastructure or financial backing.',
        objectives: [
          'Support credible industry events, open-source tools, and technical initiatives.',
          'Deliver clear brand visibility and meaningful technical participation.',
          'Evaluate sponsorship outcomes against documented event metrics.',
        ],
        benefits: [
          'Event or project sponsorship support (in-kind infrastructure or agreed funding)',
          'Co-branded event announcements and speaker/mentor participation',
          'Custom promotional packages tailored to event audience',
        ],
        expectations: [
          'Detailed event prospectus with audience breakdown and deliverable schedule',
          'Timely fulfillment of agreed brand placement and post-event reporting',
          'Compliance with safety, inclusivity, and legal event requirements',
        ],
        eligibility: [
          'Structured event, open-source project, or media series with a clear timeline',
          'Submission at least 30 days prior to event launch where practical',
        ],
        examples: [
          'Cloud infrastructure sponsorship for a regional university software hackathon',
          'Official technology sponsor for an annual creator & developer summit',
        ],
        conditions: [
          'Sponsorship deliverables and disbursement schedules require a signed Sponsorship Order.',
        ],
        comparison: {
          brandPromotion: 'Available',
          technicalCollaboration: 'Optional',
          infrastructureAccess: 'Negotiable',
          revenueSharing: 'Not Included',
          jointProjects: 'Optional',
          communityExposure: 'Available',
          marketingSupport: 'Available',
          longTermCollaboration: 'Optional',
          customAgreements: 'Available',
        },
        sort: 6,
      },
      {
        slug: 'service-exchange',
        code: '07',
        name: 'Service Exchange Partnership',
        short_description: 'Mutual exchange of services, products, technical resources, or expertise.',
        overview:
          'Reciprocal value-exchange framework enabling complementary organizations to trade specialized services—such as cloud hosting, design production, QA testing, or advisory—under balanced, documented terms.',
        objectives: [
          'Enable lean, high-trust resource sharing without unnecessary cash friction.',
          'Match equivalent service tiers with clear scope boundaries and SLAs.',
          'Build operational familiarity prior to broader commercial agreements.',
        ],
        benefits: [
          'Access to HelzerX Cloud, Studio, or Solutions capabilities via scoped service credits',
          'Structured statement-of-work parity so both sides receive fair value',
          'Pathway to upgrade into a Strategic or Technology Partnership',
        ],
        expectations: [
          'Equal commitment to delivery quality for exchanged services as for paid clients',
          'Explicit valuation cap, timeline, and termination notice clauses',
          'Regular milestone check-ins through the Partner Portal',
        ],
        eligibility: [
          'Verifiable service capability that directly complements a HelzerX division',
          'Capacity to deliver agreed work within stated timeframes',
        ],
        examples: [
          'Managed cloud server hosting exchanged for specialized security auditing services',
          'Creative studio design sprints exchanged for localized technical content production',
        ],
        conditions: [
          'All exchanged deliverables must be itemized in a signed Service Exchange Schedule.',
        ],
        comparison: {
          brandPromotion: 'Optional',
          technicalCollaboration: 'Available',
          infrastructureAccess: 'Negotiable',
          revenueSharing: 'Not Included',
          jointProjects: 'Available',
          communityExposure: 'Optional',
          marketingSupport: 'Optional',
          longTermCollaboration: 'Optional',
          customAgreements: 'Available',
        },
        sort: 7,
      },
      {
        slug: 'custom',
        code: '08',
        name: 'Custom Partnership',
        short_description: 'Custom business proposals and unique collaboration opportunities.',
        overview:
          'Open pathway for innovative joint ventures, academic research collaborations, regional distribution proposals, or multi-division initiatives that do not fit a single standard category.',
        objectives: [
          'Evaluate bespoke proposals with open-minded commercial and technical rigor.',
          'Combine elements from multiple HelzerX divisions into a unified program.',
          'Co-author clear governance rules before pilot execution.',
        ],
        benefits: [
          'Flexible agreement architecture spanning Cloud, Studio, Shop, and Solutions',
          'Direct proposal review by HelzerX leadership and relevant division leads',
          'Bespoke pilot milestone structure with clear go/no-go criteria',
        ],
        expectations: [
          'Comprehensive written proposal outlining mutual value, risks, and responsibilities',
          'Willingness to iterate during the Negotiation and due-diligence phases',
          'Realistic timelines and verifiable resource commitments',
        ],
        eligibility: [
          'Clear organizational identity and well-articulated business or technical thesis',
        ],
        examples: [
          'Multi-division university innovation lab combining Cloud infrastructure and Studio tooling',
          'Regional technology reseller and implementation alliance',
        ],
        conditions: [
          'Custom proposals undergo thorough commercial, technical, and legal review before approval.',
        ],
        comparison: {
          brandPromotion: 'Negotiable',
          technicalCollaboration: 'Negotiable',
          infrastructureAccess: 'Negotiable',
          revenueSharing: 'Negotiable',
          jointProjects: 'Negotiable',
          communityExposure: 'Negotiable',
          marketingSupport: 'Negotiable',
          longTermCollaboration: 'Negotiable',
          customAgreements: 'Available',
        },
        sort: 8,
      },
    ];

    for (const t of types) {
      insertType.run(
        uuid(),
        t.slug,
        t.code,
        t.name,
        t.short_description,
        t.overview,
        JSON.stringify(t.objectives),
        JSON.stringify(t.benefits),
        JSON.stringify(t.expectations),
        JSON.stringify(t.eligibility),
        JSON.stringify(t.examples),
        JSON.stringify(t.conditions),
        JSON.stringify(t.comparison),
        t.sort
      );
    }

    // 3. Seed Partnership Benefits (Technology, Marketing, Business, Community)
    const insertBenefit = db.prepare(`
      INSERT INTO partnership_benefits (id, category, title, description, availability_tier, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);

    const benefitsData: Array<[string, string, string, string, number]> = [
      ['TECHNOLOGY', 'Hosting Resources', 'Dedicated or sandboxed compute and game-hosting resources provisioned via HelzerX Cloud for approved integrations and community events.', 'POTENTIAL', 1],
      ['TECHNOLOGY', 'Technical Assistance', 'Direct engineering guidance during API integration, deployment configuration, and operational onboarding.', 'CONFIRMED', 2],
      ['TECHNOLOGY', 'Infrastructure Collaboration', 'Joint architecture planning for scalable workloads, high-availability clusters, and automated provisioning.', 'NEGOTIABLE', 3],
      ['TECHNOLOGY', 'Software Solutions', 'Access to modular automation tooling and software integrations developed within HelzerX Solutions.', 'POTENTIAL', 4],
      ['TECHNOLOGY', 'Development Support', 'Coordinated engineering checkpoints and staging environment testing for joint product initiatives.', 'CONFIRMED', 5],
      ['TECHNOLOGY', 'Technical Consulting', 'Structured architecture and automation advisory sessions scoped to active partnership milestones.', 'NEGOTIABLE', 6],

      ['MARKETING', 'Brand Exposure', 'Verified listing in the public HelzerX Partner Directory upon approval and public visibility opt-in.', 'CONFIRMED', 1],
      ['MARKETING', 'Social Media Promotion', 'Coordinated launch and milestone announcements across official HelzerX communication channels.', 'POTENTIAL', 2],
      ['MARKETING', 'Joint Campaigns', 'Co-branded promotional initiatives aligned with mutually agreed messaging and campaign calendars.', 'NEGOTIABLE', 3],
      ['MARKETING', 'Community Promotion', 'Featured placement in community newsletters, briefings, and partner showcases.', 'POTENTIAL', 4],
      ['MARKETING', 'Event Promotion', 'Co-marketing support for webinars, technical workshops, tournaments, and community launches.', 'POTENTIAL', 5],
      ['MARKETING', 'Cross-Marketing', 'Reciprocal audience awareness campaigns across HelzerX Shop, Studio, and partner platforms.', 'NEGOTIABLE', 6],

      ['BUSINESS', 'Revenue Sharing Opportunities', 'Structured revenue share models for qualifying co-developed solutions and enterprise deployments.', 'NEGOTIABLE', 1],
      ['BUSINESS', 'Affiliate Commissions', 'Transparent referral commission schedules for verified Affiliate Partnerships.', 'POTENTIAL', 2],
      ['BUSINESS', 'Business Referrals', 'Two-way client introductions when project requirements align with verified partner specializations.', 'POTENTIAL', 3],
      ['BUSINESS', 'Joint Business Opportunities', 'Collaborative bidding and scoped delivery across enterprise technology and web production mandates.', 'NEGOTIABLE', 4],
      ['BUSINESS', 'Long-Term Collaboration', 'Multi-phase partnership roadmap with dedicated Partnership Manager oversight and renewal planning.', 'CONFIRMED', 5],

      ['COMMUNITY', 'Discord Collaboration', 'Verified partner channels, role recognition, and coordinated community moderation workflows.', 'CONFIRMED', 1],
      ['COMMUNITY', 'Community Events', 'Joint organization of tournaments, buildathons, AMAs, and educational technical sessions.', 'POTENTIAL', 2],
      ['COMMUNITY', 'Member Promotions', 'Scoped promotional codes or curated product perks for verified community members.', 'NEGOTIABLE', 3],
      ['COMMUNITY', 'Exclusive Campaigns', 'Co-designed seasonal initiatives tailored to engaged gaming and developer ecosystems.', 'NEGOTIABLE', 4],
    ];

    for (const [cat, title, desc, tier, sort] of benefitsData) {
      insertBenefit.run(uuid(), cat, title, desc, tier, sort);
    }

    // 4. Seed Partner Requirements / Expectations
    const insertReq = db.prepare(`
      INSERT INTO partnership_requirements (id, title, description, category, is_mandatory, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const requirements = [
      ['Professional Communication', 'Responsive, respectful, and structured communication through designated representatives and the Partner Portal.', 'COMMUNICATION', 1, 1],
      ['Mutual Respect', 'Commitment to constructive collaboration where both organizations operate as equal stakeholders.', 'CULTURE', 1, 2],
      ['Reliability', 'Meeting agreed milestones, response windows, and operational commitments without unannounced delays.', 'OPERATIONS', 1, 3],
      ['Transparency', 'Honest reporting of capabilities, constraints, project risks, and attribution metrics.', 'GOVERNANCE', 1, 4],
      ['Brand Reputation', 'Maintaining high ethical and public standards that reflect positively on both organizations.', 'BRAND', 1, 5],
      ['Quality Standards', 'Delivering software, creative assets, hosting, or community experiences that meet documented quality baselines.', 'DELIVERY', 1, 6],
      ['Long-Term Commitment', 'Focus on sustainable mutual value rather than short-term opportunistic promotion.', 'STRATEGY', 0, 7],
      ['Ethical Business Practices', 'Compliance with applicable laws, privacy standards, intellectual property rights, and fair competition.', 'COMPLIANCE', 1, 8],
      ['Agreed Responsibilities', 'Clear ownership and timely execution of deliverables outlined in the executed partnership schedule.', 'GOVERNANCE', 1, 9],
    ];
    for (const [title, desc, cat, mand, sort] of requirements) {
      insertReq.run(uuid(), title, desc, cat, mand, sort);
    }

    // 5. Seed FAQs
    const insertFaq = db.prepare(`
      INSERT INTO faqs (id, category, question, answer, sort_order, is_published)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const faqs = [
      ['Applications', 'How long does HelzerX take to review a partnership application?', 'Initial screening typically occurs after submission. Applications move through Pending Review and Under Review stages, with status updates visible in your Partner Portal and via email notifications if enabled.'],
      ['Applications', 'Can we submit a proposal even if our collaboration spans multiple HelzerX divisions?', 'Yes. You may select a primary partnership category—or choose Custom Partnership—and outline how your proposal connects with HelzerX Cloud, Studio, Shop, or Solutions.'],
      ['Benefits & Terms', 'Are all listed benefits guaranteed upon approval?', 'No. Confirmed baseline benefits apply to approved partners, while potential or negotiable benefits (such as infrastructure grants, revenue sharing, or custom agreements) are evaluated and finalized during the Negotiation stage.'],
      ['Security & Privacy', 'Who can view the documents we upload during our application?', 'Uploaded documents are stored privately outside the public web root and are accessible only to authorized HelzerX reviewers and your organization account.'],
      ['Partner Directory', 'Will our organization automatically appear in the public Partner Directory?', 'No. Public Partner Directory visibility is strictly opt-in and requires explicit administrator approval alongside your consent.'],
      ['Meetings', 'Can we schedule an introductory call before submitting a formal application?', 'Yes. Use the Request a Meeting page to propose a preferred date, time, and meeting topic with our alliances team.'],
    ];
    faqs.forEach(([cat, q, a], i) => insertFaq.run(uuid(), cat, q, a, i + 1));

    // 6. Seed Website Content (CMS configurable sections)
    const insertContent = db.prepare(`
      INSERT INTO website_content (key, section, title, content_json)
      VALUES (?, ?, ?, ?)
    `);

    insertContent.run(
      'hero',
      'homepage',
      'Hero Section',
      JSON.stringify({
        brandLabel: 'HELZERX TECHNOLOGIES',
        kicker: 'BUILT FOR SHARED GROWTH',
        headlinePrefix: 'STRATEGIC PARTNERSHIPS. SHARED GROWTH.',
        headlineAccent: 'LIMITLESS POSSIBILITIES.',
        description:
          'We believe meaningful partnerships create stronger businesses, better technology, and greater opportunities. Discover how your organization can collaborate with HelzerX Technologies.',
        primaryCta: 'Explore Partnership Opportunities',
        secondaryCta: 'Become a Partner',
      })
    );

    insertContent.run(
      'about',
      'company',
      'About HelzerX Technologies',
      JSON.stringify({
        overview:
          'HelzerX Technologies is an emerging technology-focused organization building modern cloud infrastructure, digital engineering services, technology commerce, and business automation solutions.',
        vision:
          'To cultivate a resilient, transparent ecosystem where independent technology teams, creators, and enterprises build lasting capabilities together.',
        mission:
          'Deliver dependable infrastructure, thoughtful software engineering, and structured partnership frameworks built on mutual trust and measurable execution.',
        businessFocus:
          'Operating across four integrated divisions—Cloud, Studio, Shop, and Solutions—HelzerX connects technical execution with commercial collaboration.',
        approach:
          'Every partnership begins with clear expectations, documented scope, and private portal transparency rather than vague promises.',
        futureDirection:
          'Expanding international partner alliances, modular automation pipelines, and developer-ready hosting infrastructure.',
        note: 'Company registration details, jurisdiction filings, and verified milestones can be updated directly by administrators once finalized.',
      })
    );

    insertContent.run(
      'divisions',
      'divisions',
      'HelzerX Business Divisions',
      JSON.stringify([
        {
          id: 'cloud',
          code: '01',
          name: 'HELZERX CLOUD',
          subtitle: 'Infrastructure & Hosting',
          description:
            'High-reliability compute environments, managed game server infrastructure, and scalable hosting architectures engineered for demanding workloads.',
          services: ['Game Hosting', 'Cloud Hosting', 'Server Infrastructure', 'Hosting Solutions'],
          image: '/src/assets/images/division_cloud_infra_1795337527583.jpg',
          recommendedPartnership: 'Technology or Community Partnership',
        },
        {
          id: 'studio',
          code: '02',
          name: 'HELZERX STUDIO',
          subtitle: 'Engineering & Creative',
          description:
            'Full-stack web engineering, interface systems, brand identity design, and cohesive digital production for growing organizations.',
          services: ['Web Development', 'Creative Design', 'Branding', 'Digital Production'],
          image: '/src/assets/images/division_studio_design_1795337527852.jpg',
          recommendedPartnership: 'Marketing or Service Exchange Partnership',
        },
        {
          id: 'shop',
          code: '03',
          name: 'HELZERX SHOP',
          subtitle: 'Digital Commerce',
          description:
            'Curated digital products, e-commerce ecosystems, software assets, and modern technology products built for global distribution.',
          services: ['Digital Products', 'E-Commerce', 'Technology Products', 'Distribution Channels'],
          image: '/src/assets/images/hero_portal_showcase_1795337528004.jpg',
          recommendedPartnership: 'Affiliate or Marketing Partnership',
        },
        {
          id: 'solutions',
          code: '04',
          name: 'HELZERX SOLUTIONS',
          subtitle: 'Enterprise Systems',
          description:
            'Bespoke software engineering, workflow automation pipelines, systems integration, and technical consulting for modern teams.',
          services: ['Custom Technology Solutions', 'Business Automation', 'Software Solutions', 'Technical Consulting'],
          image: '/src/assets/images/case_study_enterprise_1795337527585.jpg',
          recommendedPartnership: 'Strategic or Technology Partnership',
        },
      ])
    );

    insertContent.run(
      'announcements',
      'homepage',
      'Portal Announcements',
      JSON.stringify({
        enabled: true,
        title: 'Partnership Applications Open for 2026 Collaboration Tracks',
        summary:
          'Organizations may now submit proposals across all eight HelzerX partnership tracks and manage documentation directly through the Partner Portal.',
      })
    );

    insertContent.run(
      'contact',
      'contact',
      'Contact Information',
      JSON.stringify({
        email: 'partnerships@helzerx.example',
        supportEmail: 'alliances@helzerx.example',
        headquarters: 'International Remote & Distributed Operations (Address configurable by Admin)',
        responseWindow: '1–3 Business Days',
        officeHours: 'Monday – Friday, 09:00 – 18:00 UTC',
      })
    );

    insertContent.run(
      'case_studies',
      'case_studies',
      'Partnership Collaboration Frameworks (Editable Templates)',
      JSON.stringify([
        {
          id: 'cs-template-1',
          isTemplate: true,
          category: 'Technology & Cloud',
          title: 'Managed Infrastructure & Provisioning Integration Blueprint',
          summary:
            'Illustrative framework showing how a technology partner integrates automated deployment tooling with HelzerX Cloud.',
          challenge: 'Partner organizations often need isolated staging environments and predictable API orchestration.',
          solution: 'Structured sandbox provisioning, technical review checkpoints, and documented SLA boundaries.',
          outcome: 'Editable placeholder — replace with verified partner metrics once published by Administrator.',
          image: '/src/assets/images/division_cloud_infra_1795337527583.jpg',
        },
        {
          id: 'cs-template-2',
          isTemplate: true,
          category: 'Community & Events',
          title: 'Co-Branded Community Tournament & Hosting Framework',
          summary:
            'Illustrative collaboration model for gaming communities and creator collectives organizing seasonal digital events.',
          challenge: 'Scaling reliable multiplayer infrastructure and unified promotional communication for multi-day events.',
          solution: 'Scoped HelzerX Cloud event capacity paired with HelzerX Studio co-branded event assets.',
          outcome: 'Editable placeholder — replace with verified post-event outcomes approved for publication.',
          image: '/src/assets/images/case_study_enterprise_1795337527585.jpg',
        },
      ])
    );

    // Legal Draft Documents
    const legalDrafts: Array<[string, string, string]> = [
      [
        'legal_privacy',
        'Privacy Policy (Draft — Pending Legal Counsel Review)',
        'HelzerX Technologies collects only the organization, contact, proposal, and authentication data strictly necessary to evaluate partnership applications, operate the Partner Portal, and fulfill agreed communications. Uploaded documents are stored privately and never sold to third parties. Data retention, deletion requests, and consent controls are managed in Account Settings. Status: DRAFT TEMPLATE — requires review and formal approval by qualified legal counsel before production reliance.',
      ],
      [
        'legal_terms',
        'Terms of Service (Draft — Pending Legal Counsel Review)',
        'Use of the HelzerX Corporate Partnerships Portal is subject to accurate representation of your organization, lawful conduct, and respect for confidentiality. Submission of an application does not constitute a binding commercial contract or guarantee of approval. Status: DRAFT TEMPLATE — requires review and formal approval by qualified legal counsel.',
      ],
      [
        'legal_partnership_terms',
        'Partnership Terms (Draft — Pending Legal Counsel Review)',
        'Formal partnership rights, resource allocations, brand usage permissions, revenue sharing, and termination clauses take effect only upon written execution of a dedicated Partnership Agreement by authorized signatories of both organizations. Status: DRAFT TEMPLATE — requires legal review.',
      ],
      [
        'legal_aup',
        'Acceptable Use Policy (Draft — Pending Legal Counsel Review)',
        'Partners and portal users must not upload malicious payloads, attempt unauthorized access to other partner records, misrepresent HelzerX endorsements, or engage in deceptive promotional practices. Status: DRAFT TEMPLATE — requires legal review.',
      ],
      [
        'legal_data_handling',
        'Data Handling Policy (Draft — Pending Legal Counsel Review)',
        'Application records, internal notes, and private documents are segregated by role-based access control. Partners may access only their own organization records; administrators and assigned reviewers are logged via immutable audit trails. Status: DRAFT TEMPLATE — requires legal review.',
      ],
      [
        'legal_cookies',
        'Cookie Policy (Draft — Pending Legal Counsel Review)',
        'The HelzerX Partnerships Portal uses strictly necessary HTTP-only session cookies to maintain authenticated sessions and CSRF protection. No invasive third-party advertising trackers are used. Status: DRAFT TEMPLATE — requires legal review.',
      ],
      [
        'legal_nda',
        'NDA Information (Draft — Pending Legal Counsel Review)',
        'Mutual Non-Disclosure Agreements may be initiated during the Under Review or Negotiation stages prior to exchanging sensitive architecture diagrams, financial structures, or proprietary source code. Status: DRAFT TEMPLATE — requires legal review.',
      ],
    ];

    for (const [key, title, body] of legalDrafts) {
      insertContent.run(
        key,
        'legal',
        title,
        JSON.stringify({
          isDraft: true,
          lastReviewedBy: 'Unverified Draft — Pending Qualified Legal Review',
          body,
        })
      );
    }

    // 7. Email Templates
    const insertTpl = db.prepare(`
      INSERT INTO email_templates (key, name, subject, html_body, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const templates: Array<[string, string, string, string]> = [
      [
        'account_registration',
        'Account Registration & Verification',
        'Verify your HelzerX Partnerships account',
        '<h2>Welcome to HelzerX Partnerships</h2><p>Hello {{name}}, thank you for registering with the HelzerX Corporate Partnerships Portal. Please verify your email using token: <strong>{{token}}</strong> or the verification link in your portal.</p>',
      ],
      [
        'application_confirmation',
        'Application Submission Confirmation',
        'HelzerX Partnership Application Received — {{referenceId}}',
        '<h2>Application Received</h2><p>Hello {{contactPerson}}, your partnership proposal for <strong>{{organizationName}}</strong> has been logged under reference <strong>{{referenceId}}</strong>.</p><p>Current Status: <strong>{{status}}</strong></p>',
      ],
      [
        'application_status_changed',
        'Application Status Updated',
        'Update on HelzerX Application {{referenceId}}: {{newStatus}}',
        '<h2>Application Status Updated</h2><p>Hello {{contactPerson}}, application <strong>{{referenceId}}</strong> has moved from {{oldStatus}} to <strong>{{newStatus}}</strong>.</p><p>{{note}}</p>',
      ],
      [
        'meeting_confirmation',
        'Meeting Request Update',
        'HelzerX Meeting Request: {{status}}',
        '<h2>Meeting Request Update</h2><p>Hello {{contactPerson}}, your meeting request for {{preferredDate}} at {{preferredTime}} is now <strong>{{status}}</strong>.</p><p>Meeting Link: {{meetingLink}}</p>',
      ],
      [
        'new_message',
        'New Partner Portal Message',
        'New message regarding {{subject}}',
        '<h2>New Portal Message</h2><p>You have received a new message in the HelzerX Partnerships Portal from {{senderName}}.</p>',
      ],
      [
        'password_reset',
        'Password Reset Request',
        'Reset your HelzerX Partnerships password',
        '<h2>Password Reset</h2><p>Use the following reset code to set a new password: <strong>{{token}}</strong>. This code expires in 60 minutes.</p>',
      ],
    ];
    for (const [key, name, subj, body] of templates) {
      insertTpl.run(key, name, subj, body);
    }

    // 8. System Settings
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value, description)
      VALUES (?, ?, ?)
    `);
    insertSetting.run('portal_name', 'HelzerX Partnerships', 'Public display name of the partnership portal');
    insertSetting.run('applications_open', 'true', 'Whether new partnership applications are currently accepted');
    insertSetting.run('data_retention_days', '730', 'Configurable retention period (days) for closed applications');
    insertSetting.run('max_upload_mb', '10', 'Maximum document upload size in megabytes');
    insertSetting.run('email_provider_mode', process.env.SMTP_HOST ? 'smtp' : 'internal_outbox', 'Active email dispatch mode');

    // 9. Seed 1 Sample Organization + 1 Sample Application (so Partner Portal & Admin Analytics work out of the box with real DB rows)
    db.prepare(`
      INSERT INTO organizations (
        id, owner_user_id, name, organization_type, country, website, description,
        year_established, public_directory_approved, public_category, collaboration_summary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'ACTIVE')
    `).run(
      orgId,
      partnerUserId,
      'Northstar Cloud Systems (Sample Partner)',
      'Technology Company',
      'United Kingdom',
      'https://example-org.test',
      'Sample demonstration organization profile showing how an approved partner appears inside the Partner Portal and Directory.',
      2023,
      'Technology Partnership',
      'Sample integration demonstration workspace — editable or removable from the Admin Dashboard.'
    );

    db.prepare(`
      INSERT INTO organization_members (id, organization_id, user_id, member_role)
      VALUES (?, ?, ?, 'OWNER')
    `).run(uuid(), orgId, partnerUserId);

    db.prepare(`
      INSERT INTO partner_applications (
        id, reference_id, applicant_user_id, organization_id, partnership_type_slug,
        contact_person, contact_position, contact_email, discord_username, phone_number,
        why_partner, what_can_offer, what_expect, objectives, resources_contributed,
        expected_duration, additional_info, source, status, assigned_manager_id,
        terms_accepted, privacy_accepted
      ) VALUES (?, 'HX-PARTNER-2026-00001', ?, ?, 'technology', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Direct Portal', 'Under Review', ?, 1, 1)
    `).run(
      appId,
      partnerUserId,
      orgId,
      'Marcus Sterling',
      'Head of Partnerships',
      'partner@example-org.test',
      'msterling_ops',
      '+44 20 7946 0000',
      'We aim to integrate automated observability telemetry with HelzerX Cloud workloads.',
      'Dedicated engineering liaison, API documentation, and joint technical testing.',
      'Sandbox evaluation access and technical architecture alignment.',
      'Complete interoperability validation and publish joint integration guide.',
      '2 senior systems engineers and staging test suite.',
      '12 Months (Renewable)',
      'Sample seeded application record for end-to-end verification.',
      managerId
    );

    db.prepare(`
      INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by_user_id, note)
      VALUES (?, ?, NULL, 'Submitted', ?, 'Initial partnership proposal submitted.')
    `).run(uuid(), appId, partnerUserId);

    db.prepare(`
      INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_by_user_id, note)
      VALUES (?, ?, 'Submitted', 'Under Review', ?, 'Assigned to Partnership Manager Elena Vance for technical scoping.')
    `).run(uuid(), appId, adminId);

    db.prepare(`
      INSERT INTO messages (id, application_id, organization_id, sender_user_id, sender_role, subject, body)
      VALUES (?, ?, ?, ?, 'PARTNERSHIP_MANAGER', 'Technical Integration Review — HX-PARTNER-2026-00001', 'Hello Marcus, thank you for submitting your Technology Partnership proposal. Our engineering leads are reviewing your architecture summary and will follow up with sandbox onboarding questions shortly.')
    `).run(uuid(), appId, orgId, managerId);

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, body, category, link_path)
      VALUES (?, ?, 'Application Under Review', 'Your application HX-PARTNER-2026-00001 is now Under Review with Elena Vance.', 'APPLICATION', '/portal/status')
    `).run(uuid(), partnerUserId);

    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, actor_email, action, entity_type, entity_id, details_json)
      VALUES (?, ?, ?, 'SYSTEM_SEED', 'system', 'initial', ?)
    `).run(uuid(), adminId, adminEmail, JSON.stringify({ message: 'Database seeded with initial HelzerX portal schema and baseline records.' }));
  });
}
