import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Briefcase,
  CheckCircle2,
  Cloud,
  Code2,
  Compass,
  Handshake,
  Layers,
  Megaphone,
  Server,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SafeImage, SectionHeader } from '../components/UiPrimitives';

const DIVISION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cloud: Cloud,
  studio: Code2,
  shop: ShoppingBag,
  solutions: Blocks,
};

export default function HomePage() {
  const { bootstrap } = useApp();
  const hero = bootstrap?.content?.hero;
  const about = bootstrap?.content?.about;
  const divisions = bootstrap?.content?.divisions || [];
  const announcement = bootstrap?.content?.announcements;
  const partnershipTypes = bootstrap?.partnershipTypes || [];
  const benefits = bootstrap?.benefits || [];

  const processSteps = [
    {
      step: '01',
      title: 'Explore & Select Model',
      desc: 'Review our eight partnership frameworks and compare eligibility, expectations, and available benefits.',
    },
    {
      step: '02',
      title: 'Submit Your Proposal',
      desc: 'Complete the multi-step application with organization details, objectives, and supporting documentation.',
    },
    {
      step: '03',
      title: 'Structured Review',
      desc: 'Assigned HelzerX reviewers evaluate technical, operational, and brand alignment.',
    },
    {
      step: '04',
      title: 'Negotiation & Scope',
      desc: 'Clarify negotiable resources, commercial frameworks, responsibilities, and mutual NDA terms.',
    },
    {
      step: '05',
      title: 'Agreement Execution',
      desc: 'Finalize formal partnership agreements and assign dedicated Partner Portal access.',
    },
    {
      step: '06',
      title: 'Active Collaboration',
      desc: 'Track milestones, shared initiatives, and renewal checkpoints with your Partnership Manager.',
    },
  ];

  const offerCategories = [
    {
      title: 'Technology & Infrastructure',
      icon: Server,
      items: benefits.filter((b) => b.category === 'TECHNOLOGY').slice(0, 3),
    },
    {
      title: 'Marketing & Exposure',
      icon: Megaphone,
      items: benefits.filter((b) => b.category === 'MARKETING').slice(0, 3),
    },
    {
      title: 'Business & Commercial',
      icon: Briefcase,
      items: benefits.filter((b) => b.category === 'BUSINESS').slice(0, 3),
    },
    {
      title: 'Community & Events',
      icon: Users,
      items: benefits.filter((b) => b.category === 'COMMUNITY').slice(0, 3),
    },
  ];

  return (
    <div>
      {/* 1. HERO SECTION — Architectural Grid Layout matching Reference */}
      <section className="hx-grid-bg border-b border-[#ECEEEC] pt-10 pb-14 lg:pt-14 lg:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {announcement?.enabled && (
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs text-[#4A504C]">
              <span className="font-semibold text-[#2B7A19] uppercase tracking-wider">Notice</span>
              <span aria-hidden="true">·</span>
              <span>{announcement.title}</span>
              <Link to="/apply" className="font-semibold text-[#111312] underline underline-offset-4 hover:text-[#2B7A19]">
                Apply Now
              </Link>
            </div>
          )}

          {/* 3-Column Editorial Hero Header matching Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-2 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A504C]">
                {hero?.brandLabel || 'HELZERX TECHNOLOGIES'}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#5A605C]">
                  {hero?.kicker || 'BUILT FOR SHARED GROWTH'}
                </span>
                <span className="h-px w-8 bg-[#C8CECA]" aria-hidden="true" />
              </div>
            </div>

            <div className="lg:col-span-6 text-left lg:text-center">
              <h1 className="font-display-condensed text-5xl sm:text-6xl lg:text-[68px] font-extrabold uppercase leading-[0.94] tracking-tight text-[#111312]">
                {hero?.headlinePrefix || 'STRATEGIC PARTNERSHIPS. SHARED GROWTH.'}{' '}
                <span className="text-[#2B7A19]">
                  {hero?.headlineAccent || 'LIMITLESS POSSIBILITIES.'}
                </span>
              </h1>
            </div>

            <div className="lg:col-span-4 space-y-5 lg:pl-4">
              <p className="text-sm sm:text-[15px] text-[#5A605C] leading-relaxed">
                {hero?.description ||
                  'We believe meaningful partnerships create stronger businesses, better technology, and greater opportunities. Discover how your organization can collaborate with HelzerX Technologies.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/opportunities"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42] transition-colors whitespace-nowrap"
                >
                  <span>{hero?.primaryCta || 'Explore Partnership Opportunities'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-full border border-[#D4D8D5] bg-white text-[#111312] hover:bg-[#F7F8F7] transition-colors whitespace-nowrap"
                >
                  <span>{hero?.secondaryCta || 'Become a Partner'}</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5A605C]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A19]" />
                  <span>8 Partnership Models</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A19]" />
                  <span>Dedicated Partner Portal</span>
                </span>
              </div>
            </div>
          </div>

          {/* Focal Composition Container — Architectural Showcase + Live Portal Preview */}
          <div className="mt-12 relative">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4 text-[11px] font-semibold uppercase tracking-wider text-[#5A605C]">
              <span>Explore</span>
              <span aria-hidden="true">·</span>
              <span>Propose</span>
              <span aria-hidden="true">·</span>
              <span>Negotiate</span>
              <span aria-hidden="true">·</span>
              <span>Collaborate</span>
            </div>

            <div className="rounded-[24px] border border-[#E2E5E2] bg-white shadow-[0_20px_50px_rgba(17,19,18,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[360px]">
                <SafeImage
                  src="/src/assets/images/hero_portal_showcase_1795337528004.jpg"
                  alt="HelzerX Technologies architectural partnership hub"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 bg-[#FAFBF9] border-t lg:border-t-0 lg:border-l border-[#E6E8E6] flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#2B7A19]">
                    HelzerX Partner Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#111312]">
                    Transparent Lifecycle Management
                  </h2>
                  <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">
                    Every proposal receives a tracked reference ID, structured review stages, private document storage, and direct communication with our alliances team.
                  </p>

                  <div className="mt-6 space-y-3 border-t border-[#E6E8E6] pt-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A605C]">Application Tracking</span>
                      <span className="font-mono font-semibold text-[#111312]">HX-PARTNER-2026-XXXXX</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A605C]">Workflow Transparency</span>
                      <span className="font-semibold text-[#2B7A19]">10 Structured Stages</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A605C]">Document Vault</span>
                      <span className="font-semibold text-[#111312]">Private RBAC Access</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-[#E6E8E6] flex items-center justify-between gap-3">
                  <Link
                    to="/process"
                    className="text-xs font-semibold text-[#111312] hover:text-[#2B7A19] inline-flex items-center gap-1"
                  >
                    <span>Review Partnership Process</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/request-meeting"
                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#0D0F0E] text-white hover:bg-[#222624]"
                  >
                    Request Meeting
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DIVISIONS ARCHITECTURAL STRIP */}
      <section className="border-b border-[#ECEEEC] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            {divisions.map((div) => {
              const Icon = DIVISION_ICONS[div.id] || Layers;
              return (
                <Link
                  key={div.id}
                  to="/divisions"
                  className="flex items-center gap-3 group py-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F4F6F4] group-hover:bg-[#E9FAD6] text-[#111312] group-hover:text-[#2B7A19] flex items-center justify-center transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-[#111312] truncate">
                      {div.name}
                    </p>
                    <p className="text-xs text-[#5A605C] truncate">{div.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. ABOUT HELZERX SECTION */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <SectionHeader
                kicker="About HelzerX Technologies"
                title="Connecting businesses."
                accent="Building the future together."
                subtitle={about?.overview}
              />
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-[#0D0F0E] text-white hover:bg-[#222624]"
                >
                  <span>Explore Company Overview</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/capabilities"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full border border-[#E2E5E2] text-[#111312] hover:bg-[#F7F8F7]"
                >
                  <span>Our Capabilities</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Vision', text: about?.vision },
                { label: 'Mission', text: about?.mission },
                { label: 'Business Focus', text: about?.businessFocus },
                { label: 'Our Approach', text: about?.approach },
              ].map((block) => (
                <div
                  key={block.label}
                  className="p-6 rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9]"
                >
                  <h3 className="text-sm font-bold text-[#111312]">{block.label}</h3>
                  <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{block.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR DIVISIONS SHOWCASE CARDS */}
      <section className="py-16 lg:py-20 bg-[#F7F8F7] border-y border-[#ECEEEC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader
              kicker="Our Business Divisions"
              title="Four specialized divisions,"
              accent="one unified partnership portal."
              subtitle="Align your organization with the HelzerX division that matches your technical, creative, or commercial roadmap."
            />
            <Link
              to="/divisions"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111312] hover:text-[#2B7A19] whitespace-nowrap"
            >
              <span>View Division Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {divisions.map((div) => {
              const Icon = DIVISION_ICONS[div.id] || Layers;
              return (
                <div
                  key={div.id}
                  className="rounded-2xl border border-[#E6E8E6] bg-white p-6 flex flex-col justify-between hover:border-[#C5CBC7] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-[#767D78]">{div.code}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#111312]">{div.name}</h3>
                    <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">
                      {div.description}
                    </p>
                    <ul className="mt-5 pt-4 border-t border-[#F0F2F0] space-y-2">
                      {div.services.map((svc) => (
                        <li key={svc} className="text-xs font-medium text-[#373C39] flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#2B7A19]" />
                          <span>{svc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F0F2F0] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#5A605C]">Explore Division</span>
                    <Link
                      to={`/divisions#${div.id}`}
                      aria-label={`Explore ${div.name}`}
                      className="w-9 h-9 rounded-full border border-[#E2E5E2] flex items-center justify-center text-[#111312] hover:bg-[#0D0F0E] hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WHY PARTNER WITH US — Dark Obsidian Contrast Block matching Reference */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] bg-[#0D0F0E] text-white p-7 sm:p-10 lg:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column */}
              <div className="lg:col-span-4 space-y-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9EE855]">
                  Why Partner With Us
                </p>
                <h2 className="font-display-condensed text-4xl sm:text-5xl font-extrabold uppercase leading-[0.95] text-white">
                  Build Stronger.{' '}
                  <span className="text-[#7FE03E]">Grow Together.</span>
                </h2>
                <p className="text-sm text-[#A7ADA9] leading-relaxed">
                  HelzerX approaches every alliance with structured documentation, transparent governance, and practical multi-division collaboration.
                </p>
                <div className="pt-2">
                  <Link
                    to="/why-partner"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full bg-white text-[#0D0F0E] hover:bg-[#E9FAD6] transition-colors whitespace-nowrap"
                  >
                    <span>Explore Advantages</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Center Photo */}
              <div className="lg:col-span-4">
                <div className="relative rounded-2xl overflow-hidden border border-[#242826] aspect-[4/3]">
                  <SafeImage
                    src="/src/assets/images/why_partner_collab_1795337527495.jpg"
                    alt="Executive collaboration at HelzerX Technologies"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4">
                    <p className="text-xs font-semibold text-[#9EE855]">Dedicated Collaboration</p>
                    <p className="text-xs text-white/90 mt-0.5">
                      Direct Partnership Manager oversight from review through renewal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column — Hairline-Divided Value Rows */}
              <div className="lg:col-span-4 space-y-1">
                <p className="text-sm text-[#C4C9C6] leading-relaxed mb-4">
                  A structured partnership ecosystem designed to help emerging and enterprise organizations move deliberately without vague promises.
                </p>
                <Link
                  to="/compare"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-4 hover:text-[#9EE855] mb-5"
                >
                  <span>Compare Partnership Models</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <div className="divide-y divide-[#242826] border-t border-[#242826]">
                  {[
                    {
                      icon: Code2,
                      title: 'Technology & Infrastructure Access',
                      desc: 'Scoped compute, APIs, and engineering alignment across Cloud & Solutions.',
                    },
                    {
                      icon: Megaphone,
                      title: 'Co-Marketing & Community Reach',
                      desc: 'Coordinated campaigns, event support, and approved directory placement.',
                    },
                    {
                      icon: Handshake,
                      title: 'Mutual Growth & Long-Term Scope',
                      desc: 'Transparent referral, service exchange, and strategic roadmaps.',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="py-4 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-full border border-[#2C312E] flex items-center justify-center text-[#9EE855] shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <p className="text-xs text-[#9EA4A0] mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PARTNERSHIP OPPORTUNITIES (8 Tracks) */}
      <section className="py-16 lg:py-20 bg-[#F7F8F7] border-y border-[#ECEEEC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader
              kicker="Partnership Opportunities"
              title="Eight structured models"
              accent="for every collaboration style."
              subtitle="Select a partnership track to review objectives, eligibility, expected commitments, and configurable benefits."
            />
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full border border-[#D4D8D5] bg-white text-[#111312] hover:bg-[#0D0F0E] hover:text-white transition-colors whitespace-nowrap"
            >
              <span>Compare All Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {partnershipTypes.map((pt) => (
              <Link
                key={pt.slug}
                to={`/partnerships/${pt.slug}`}
                className="group rounded-2xl border border-[#E6E8E6] bg-white p-6 flex flex-col justify-between hover:border-[#0D0F0E] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-[#2B7A19]">{pt.code}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#767D78] group-hover:text-[#111312] transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-[#111312] group-hover:text-[#2B7A19] transition-colors">
                    {pt.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">
                    {pt.shortDescription}
                  </p>
                </div>
                <p className="mt-5 pt-4 border-t border-[#F0F2F0] text-xs font-semibold text-[#111312]">
                  View Criteria & Benefits
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHAT WE OFFER — Categorized Snapshot matching Reference Lower Cards */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader
              kicker="What HelzerX Offers"
              title="Everything structured for"
              accent="sustainable collaboration."
              subtitle="Confirmed baseline support paired with clearly marked potential and negotiable resources scoped during review."
            />
            <Link
              to="/what-we-offer"
              className="text-sm font-semibold text-[#111312] hover:text-[#2B7A19] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Explore All Benefits</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {offerCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="rounded-2xl border border-[#E6E8E6] bg-white p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#111312]">{cat.title}</h3>
                    <ul className="mt-4 space-y-2.5">
                      {cat.items.map((b) => (
                        <li key={b.id} className="text-xs text-[#4A504C] leading-relaxed">
                          <span className="font-semibold text-[#111312]">{b.title}</span>
                          <span className="text-[#767D78]"> · {b.availability_tier.toLowerCase()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Link
                      to="/what-we-offer"
                      aria-label={`Explore ${cat.title}`}
                      className="w-9 h-9 rounded-full border border-[#E2E5E2] flex items-center justify-center text-[#111312] hover:bg-[#0D0F0E] hover:text-white transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. OUR PARTNERSHIP PROCESS */}
      <section className="py-16 lg:py-20 bg-[#F7F8F7] border-t border-[#ECEEEC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeader
              kicker="Partnership Process"
              title="Clear stages from"
              accent="proposal to active partnership."
              subtitle="Every step is logged and visible inside your Partner Portal."
            />
            <Link
              to="/what-we-expect"
              className="text-sm font-semibold text-[#111312] hover:text-[#2B7A19] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Read Partner Expectations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processSteps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold text-[#2B7A19]">STEP {s.step}</span>
                  <Compass className="w-4 h-4 text-[#8D938F]" />
                </div>
                <h3 className="text-base font-bold text-[#111312]">{s.title}</h3>
                <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] bg-[#0D0F0E] text-white p-8 sm:p-12 lg:p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#9EE855] text-[#0D0F0E] flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-display-condensed text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight">
              Let&apos;s Build Something{' '}
              <span className="text-[#9EE855]">Greater Together.</span>
            </h2>
            <p className="mt-4 text-base text-[#A7ADA9] max-w-2xl mx-auto">
              Submit a structured partnership proposal, attach your organization profile, or schedule an introductory briefing with the HelzerX alliances team.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42] transition-colors whitespace-nowrap"
              >
                <span>Start Your Partnership Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/request-meeting"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-full border border-[#303633] text-white hover:bg-[#1A1E1C] transition-colors whitespace-nowrap"
              >
                <span>Request a Meeting</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
