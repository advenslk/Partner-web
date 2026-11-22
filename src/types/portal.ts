export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PARTNERSHIP_MANAGER'
  | 'REVIEWER'
  | 'PARTNER';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: boolean;
  status: string;
  notifications: {
    email: boolean;
    statusUpdates: boolean;
    messages: boolean;
  };
  createdAt: string;
}

export interface DivisionItem {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  services: string[];
  image: string;
  recommendedPartnership: string;
}

export interface PartnershipTypeItem {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  overview: string;
  objectives: string[];
  benefits: string[];
  expectations: string[];
  eligibility: string[];
  examples: string[];
  conditions: string[];
  comparison: Record<string, 'Available' | 'Optional' | 'Negotiable' | 'Not Included'>;
}

export interface BenefitItem {
  id: string;
  category: 'TECHNOLOGY' | 'MARKETING' | 'BUSINESS' | 'COMMUNITY';
  title: string;
  description: string;
  availability_tier: 'CONFIRMED' | 'POTENTIAL' | 'NEGOTIABLE';
}

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  category: string;
  is_mandatory: number;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface DirectoryPartner {
  id: string;
  name: string;
  organization_type: string;
  country: string;
  website: string | null;
  description: string;
  logo_url: string | null;
  public_category: string | null;
  collaboration_summary: string | null;
}

export interface CaseStudyTemplate {
  id: string;
  isTemplate?: boolean;
  category: string;
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  image: string;
}

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

export interface LegalDoc {
  key: string;
  slug: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  isDraft: boolean;
  legalReviewNotice: string;
  publishedAt: string | null;
  lastUpdatedAt: string;
  sections: LegalSection[];
}

export interface BootstrapData {
  content: {
    hero: {
      brandLabel: string;
      kicker: string;
      headlinePrefix: string;
      headlineAccent: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
    about: {
      overview: string;
      vision: string;
      mission: string;
      businessFocus: string;
      approach: string;
      futureDirection: string;
      note: string;
    };
    divisions: DivisionItem[];
    announcements: {
      enabled: boolean;
      title: string;
      summary: string;
    };
    contact: {
      email: string;
      supportEmail: string;
      headquarters: string;
      responseWindow: string;
      officeHours: string;
    };
    case_studies: CaseStudyTemplate[];
  };
  legal: Record<string, LegalDoc>;
  partnershipTypes: PartnershipTypeItem[];
  benefits: BenefitItem[];
  requirements: RequirementItem[];
  faqs: FaqItem[];
  directory: DirectoryPartner[];
  settings: {
    portalName: string;
    applicationsOpen: boolean;
  };
}
