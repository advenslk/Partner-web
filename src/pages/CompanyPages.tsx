import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Cloud,
  Code2,
  Compass,
  Globe2,
  Layers,
  Shield,
  ShoppingBag,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SafeImage, SectionHeader } from '../components/UiPrimitives';

export function AboutPage() {
  const { bootstrap } = useApp();
  const about = bootstrap?.content?.about;

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <SectionHeader
              kicker="About HelzerX Technologies"
              title="Emerging technology business built on"
              accent="transparent partnerships."
              subtitle={about?.overview}
            />
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/divisions"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42]"
              >
                <span>Explore Our Divisions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-full border border-[#E2E5E2] text-[#111312] hover:bg-[#F7F8F7]"
              >
                <span>Submit a Proposal</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-[#E6E8E6] aspect-[16/10]">
              <SafeImage
                src="/src/assets/images/case_study_enterprise_1795337527585.jpg"
                alt="HelzerX Technologies corporate briefing space"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Vision', body: about?.vision },
            { title: 'Mission', body: about?.mission },
            { title: 'Business Focus', body: about?.businessFocus },
            { title: 'Our Approach', body: about?.approach },
            { title: 'Future Direction', body: about?.futureDirection },
            {
              title: 'Corporate Transparency',
              body:
                about?.note ||
                'HelzerX publishes only verified organizational facts. Official corporate filings and milestone announcements are updated directly by portal administrators.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6">
              <h2 className="text-lg font-bold text-[#111312]">{item.title}</h2>
              <p className="mt-2.5 text-sm text-[#5A605C] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DivisionsPage() {
  const { bootstrap } = useApp();
  const divisions = bootstrap?.content?.divisions || [];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    cloud: Cloud,
    studio: Code2,
    shop: ShoppingBag,
    solutions: Blocks,
  };

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          kicker="Our Divisions"
          title="Four integrated operating divisions"
          accent="across technology and commerce."
          subtitle="Partner with an individual division or propose a cross-division collaboration tailored to your organization."
        />

        <div className="space-y-8">
          {divisions.map((div) => {
            const Icon = iconMap[div.id] || Layers;
            return (
              <div
                id={div.id}
                key={div.id}
                className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
              >
                <div className="lg:col-span-5 min-h-[240px]">
                  <SafeImage
                    src={div.image}
                    alt={div.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs text-[#5A605C]">
                        DIVISION {div.code} · {div.subtitle}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#111312]">{div.name}</h2>
                    <p className="mt-3 text-sm text-[#5A605C] leading-relaxed">{div.description}</p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {div.services.map((svc) => (
                        <div
                          key={svc}
                          className="flex items-center gap-2 text-sm font-medium text-[#111312] bg-white border border-[#E6E8E6] rounded-xl px-3.5 py-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#2B7A19] shrink-0" />
                          <span>{svc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7 pt-5 border-t border-[#E6E8E6] flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-[#5A605C]">
                      Typical Track: <strong className="text-[#111312]">{div.recommendedPartnership}</strong>
                    </span>
                    <Link
                      to="/apply"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full bg-[#0D0F0E] text-white hover:bg-[#222624]"
                    >
                      <span>Propose {div.name} Collaboration</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesPage() {
  const capabilities = [
    {
      icon: Cloud,
      title: 'Infrastructure & Hosting Operations',
      desc: 'Managed cloud environments, dedicated game server clusters, automated provisioning pipelines, and workload monitoring via HelzerX Cloud.',
    },
    {
      icon: Code2,
      title: 'Full-Stack Web & Application Engineering',
      desc: 'TypeScript-first web platforms, design systems, partner portals, API integrations, and production-hardened backend services.',
    },
    {
      icon: Workflow,
      title: 'Business Process Automation',
      desc: 'Workflow orchestration, internal operations tooling, webhook integrations, and custom operational dashboards via HelzerX Solutions.',
    },
    {
      icon: ShoppingBag,
      title: 'Digital Commerce & Product Distribution',
      desc: 'Digital asset storefronts, licensing workflows, and partner referral tracking built around HelzerX Shop.',
    },
    {
      icon: Sparkles,
      title: 'Brand Identity & Digital Production',
      desc: 'Cohesive visual systems, campaign collateral, product UI architecture, and documentation design via HelzerX Studio.',
    },
    {
      icon: Shield,
      title: 'Security-Minded Delivery',
      desc: 'Role-based access controls, private document segregation, audit logging, and transparent compliance practices.',
    },
  ];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          kicker="Our Capabilities"
          title="Practical engineering and operational"
          accent="strengths across four divisions."
          subtitle="What HelzerX Technologies brings to joint technical builds, community initiatives, and commercial partnerships."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6">
                <div className="w-11 h-11 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-[#111312]">{cap.title}</h2>
                <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WhyPartnerPage() {
  const pillars = [
    {
      icon: Code2,
      title: 'Technology Collaboration',
      desc: 'Work directly with HelzerX engineers on API integrations, automation tooling, and shared technical architecture.',
    },
    {
      icon: Compass,
      title: 'Mutual Business Growth',
      desc: 'Structured referral, revenue-sharing, and co-delivery frameworks designed for transparent shared upside.',
    },
    {
      icon: Globe2,
      title: 'Marketing Opportunities',
      desc: 'Co-branded launches, verified Partner Directory listings, and coordinated campaign execution.',
    },
    {
      icon: Cloud,
      title: 'Infrastructure Resources',
      desc: 'Eligible technology and community partners can scope HelzerX Cloud hosting and sandbox compute resources.',
    },
    {
      icon: Layers,
      title: 'Community Access',
      desc: 'Collaborate on Discord events, workshops, tournaments, and developer community showcases.',
    },
    {
      icon: Shield,
      title: 'Long-Term Collaboration',
      desc: 'Dedicated Partnership Managers, clear agreements, and predictable renewal cadences.',
    },
  ];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          kicker="Why Partner With HelzerX"
          title="Built for reliability,"
          accent="mutual value, and clarity."
          subtitle="Six foundational pillars guiding how HelzerX Technologies collaborates with external organizations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
                <div className="w-11 h-11 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-[#111312]">{p.title}</h2>
                <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-[#0D0F0E] text-white p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Ready to evaluate your fit?</h2>
            <p className="mt-1.5 text-sm text-[#A7ADA9]">
              Compare all eight partnership tracks side by side or start your application.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/compare"
              className="px-5 py-2.5 text-sm font-semibold rounded-full border border-[#303633] text-white hover:bg-[#1A1E1C]"
            >
              Compare Models
            </Link>
            <Link
              to="/apply"
              className="px-5 py-2.5 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42]"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaseStudiesPage() {
  const { bootstrap } = useApp();
  const caseStudies = bootstrap?.content?.case_studies || [];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          kicker="Collaboration Case Studies"
          title="Illustrative partnership blueprints"
          accent="and outcome templates."
          subtitle="Transparency note: Entries marked as templates illustrate our collaboration structure and are editable by HelzerX administrators as verified public case studies are approved."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {caseStudies.map((cs) => (
            <article
              key={cs.id}
              className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9]">
                <SafeImage src={cs.image} alt={cs.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-7 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-xs text-[#5A605C] flex items-center gap-2">
                    <span className="font-semibold text-[#2B7A19]">{cs.category}</span>
                    {cs.isTemplate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Editable Framework Template</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-[#111312]">{cs.title}</h2>
                  <p className="text-sm text-[#5A605C] leading-relaxed">{cs.summary}</p>
                  <div className="pt-3 border-t border-[#E6E8E6] space-y-2 text-xs text-[#4A504C]">
                    <p>
                      <strong className="text-[#111312]">Scope Challenge:</strong> {cs.challenge}
                    </p>
                    <p>
                      <strong className="text-[#111312]">Collaboration Structure:</strong> {cs.solution}
                    </p>
                    <p>
                      <strong className="text-[#111312]">Outcome Record:</strong> {cs.outcome}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <Link
                    to="/apply"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111312] hover:text-[#2B7A19]"
                  >
                    <span>Propose Similar Collaboration</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
