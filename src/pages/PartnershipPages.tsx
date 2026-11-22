import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Megaphone,
  MinusCircle,
  Search,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, SectionHeader, StatusIndicator } from '../components/UiPrimitives';

const COMPARISON_ATTRIBUTES: Array<{ key: string; label: string }> = [
  { key: 'brandPromotion', label: 'Brand Promotion' },
  { key: 'technicalCollaboration', label: 'Technical Collaboration' },
  { key: 'infrastructureAccess', label: 'Infrastructure Access' },
  { key: 'revenueSharing', label: 'Revenue Sharing' },
  { key: 'jointProjects', label: 'Joint Projects' },
  { key: 'communityExposure', label: 'Community Exposure' },
  { key: 'marketingSupport', label: 'Marketing Support' },
  { key: 'longTermCollaboration', label: 'Long-Term Collaboration' },
  { key: 'customAgreements', label: 'Custom Agreements' },
];

function ComparisonCell({ value }: { value: string }) {
  if (value === 'Available') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B7A19]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Available</span>
      </span>
    );
  }
  if (value === 'Negotiable') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Negotiable</span>
      </span>
    );
  }
  if (value === 'Optional') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#373C39]">
        <Clock className="w-3.5 h-3.5 shrink-0 text-[#5A605C]" />
        <span>Optional</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#767D78]">
      <MinusCircle className="w-3.5 h-3.5 shrink-0" />
      <span>Not Included</span>
    </span>
  );
}

export function OpportunitiesPage() {
  const { bootstrap } = useApp();
  const types = bootstrap?.partnershipTypes || [];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeader
            kicker="Partnership Opportunities"
            title="Discover the right collaboration model"
            accent="for your organization."
            subtitle="Explore all eight official HelzerX partnership tracks. Every model is transparent, configurable, and backed by a formal review process."
          />
          <div className="flex flex-wrap gap-3">
            <Link
              to="/compare"
              className="px-5 py-2.5 text-sm font-semibold rounded-full border border-[#E2E5E2] hover:bg-[#F7F8F7] whitespace-nowrap"
            >
              Compare All Models
            </Link>
            <Link
              to="/apply"
              className="px-5 py-2.5 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42] whitespace-nowrap"
            >
              Start Application
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {types.map((pt) => (
            <div
              key={pt.slug}
              className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-7 flex flex-col justify-between hover:border-[#0D0F0E] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold text-[#2B7A19]">
                    TRACK {pt.code}
                  </span>
                  <Link
                    to={`/partnerships/${pt.slug}`}
                    className="text-xs font-semibold text-[#111312] hover:text-[#2B7A19] inline-flex items-center gap-1"
                  >
                    <span>Full Specification</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <h2 className="text-xl font-bold text-[#111312]">{pt.name}</h2>
                <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{pt.overview}</p>
                <div className="mt-5 pt-4 border-t border-[#E6E8E6] space-y-2">
                  <p className="text-xs font-semibold text-[#111312]">Key Objectives:</p>
                  {pt.objectives.slice(0, 2).map((obj, idx) => (
                    <p key={idx} className="text-xs text-[#4A504C] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A19] shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E6E8E6] flex items-center justify-between gap-3">
                <Link
                  to={`/partnerships/${pt.slug}`}
                  className="text-xs font-semibold text-[#111312] hover:underline"
                >
                  View Benefits & Eligibility
                </Link>
                <Link
                  to={`/apply?type=${pt.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-[#0D0F0E] text-white hover:bg-[#222624]"
                >
                  <span>Apply for {pt.code}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PartnershipTypeDetailPage() {
  const { slug } = useParams();
  const { bootstrap } = useApp();
  const types = bootstrap?.partnershipTypes || [];
  const pt = types.find((t) => t.slug === slug) || types[0];

  if (!pt) {
    return (
      <div className="py-20 max-w-4xl mx-auto px-4">
        <EmptyState
          title="Partnership track not found"
          description="The requested partnership model could not be loaded."
          action={
            <Link to="/opportunities" className="px-5 py-2.5 text-sm font-semibold rounded-full bg-[#0D0F0E] text-white">
              Browse All Tracks
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Track Navigation Strip */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#ECEEEC] pb-4">
          {types.map((item) => (
            <Link
              key={item.slug}
              to={`/partnerships/${item.slug}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                item.slug === pt.slug
                  ? 'bg-[#0D0F0E] text-white'
                  : 'bg-[#F4F6F4] text-[#4A504C] hover:text-[#111312]'
              }`}
            >
              {item.code} · {item.name.replace(' Partnership', '')}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div>
              <p className="font-mono text-xs font-semibold text-[#2B7A19] mb-2">
                PARTNERSHIP TRACK {pt.code}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#111312]">{pt.name}</h1>
              <p className="mt-3 text-base text-[#5A605C] leading-relaxed">{pt.overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6">
                <h2 className="text-base font-bold text-[#111312] mb-3">Objectives</h2>
                <ul className="space-y-2.5 text-sm text-[#4A504C]">
                  {pt.objectives.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2B7A19] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6">
                <h2 className="text-base font-bold text-[#111312] mb-3">
                  Potential Benefits & What HelzerX Can Offer
                </h2>
                <ul className="space-y-2.5 text-sm text-[#4A504C]">
                  {pt.benefits.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2B7A19] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
                <h2 className="text-base font-bold text-[#111312] mb-3">What We Expect</h2>
                <ul className="space-y-2.5 text-sm text-[#4A504C]">
                  {pt.expectations.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#111312] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
                <h2 className="text-base font-bold text-[#111312] mb-3">Eligibility Criteria</h2>
                <ul className="space-y-2.5 text-sm text-[#4A504C]">
                  {pt.eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2B7A19] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
              <h2 className="text-base font-bold text-[#111312]">Collaboration Examples</h2>
              <ul className="space-y-2 text-sm text-[#4A504C]">
                {pt.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-[#2B7A19] mt-0.5">0{i + 1}.</span>
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 space-y-3">
              <h2 className="text-base font-bold text-[#111312]">Important Conditions</h2>
              <ul className="space-y-2 text-sm text-[#5A605C]">
                {pt.conditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Summary Card */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#E6E8E6] bg-[#0D0F0E] text-white p-6 space-y-5">
              <h3 className="text-lg font-bold">Attribute Snapshot</h3>
              <div className="divide-y divide-[#242826]">
                {COMPARISON_ATTRIBUTES.map((attr) => {
                  const val = pt.comparison[attr.key] || 'Not Included';
                  return (
                    <div key={attr.key} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-[#A7ADA9]">{attr.label}</span>
                      <span
                        className={`font-semibold ${
                          val === 'Available'
                            ? 'text-[#9EE855]'
                            : val === 'Negotiable'
                            ? 'text-[#FBBF24]'
                            : val === 'Optional'
                            ? 'text-white'
                            : 'text-[#767D78]'
                        }`}
                      >
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link
                to={`/apply?type=${pt.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42]"
              >
                <span>Apply for {pt.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/request-meeting"
                className="w-full inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold rounded-full border border-[#303633] text-white hover:bg-[#1A1E1C]"
              >
                Schedule Exploratory Call
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function ComparisonPage() {
  const { bootstrap } = useApp();
  const types = bootstrap?.partnershipTypes || [];
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [attrFilter, setAttrFilter] = useState<string>('ALL');

  const visibleTypes = useMemo(() => {
    if (selectedSlugs.length === 0) return types;
    return types.filter((t) => selectedSlugs.includes(t.slug));
  }, [types, selectedSlugs]);

  const toggleSlug = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const visibleAttributes =
    attrFilter === 'ALL'
      ? COMPARISON_ATTRIBUTES
      : COMPARISON_ATTRIBUTES.filter((a) => a.key === attrFilter);

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          kicker="Partnership Comparison"
          title="Compare partnership models"
          accent="side by side."
          subtitle="Understand exact attribute availability across all eight partnership types. Attributes marked Negotiable or Optional are confirmed only in executed written agreements."
        />

        {/* Interactive Filter Toolbar */}
        <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5A605C]">
              Filter Models ({visibleTypes.length} shown)
            </p>
            {selectedSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSlugs([])}
                className="text-xs font-semibold text-[#2B7A19] hover:underline"
              >
                Show All 8 Models
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => {
              const active = selectedSlugs.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleSlug(t.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#0D0F0E] text-white'
                      : 'bg-white border border-[#E2E5E2] text-[#373C39] hover:border-[#0D0F0E]'
                  }`}
                >
                  {t.name.replace(' Partnership', '')}
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-[#E6E8E6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A605C]">
              <ComparisonCell value="Available" />
              <ComparisonCell value="Optional" />
              <ComparisonCell value="Negotiable" />
              <ComparisonCell value="Not Included" />
            </div>
            <select
              value={attrFilter}
              onChange={(e) => setAttrFilter(e.target.value)}
              aria-label="Filter comparison attribute"
              className="px-3 py-1.5 rounded-lg border border-[#D4D8D5] bg-white text-xs font-medium text-[#111312]"
            >
              <option value="ALL">All Comparison Attributes</option>
              {COMPARISON_ATTRIBUTES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[#E6E8E6]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#E6E8E6]">
                <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-[#5A605C] w-56">
                  Attribute
                </th>
                {visibleTypes.map((t) => (
                  <th key={t.slug} className="py-4 px-4 text-xs font-bold text-[#111312]">
                    <Link to={`/partnerships/${t.slug}`} className="hover:text-[#2B7A19] block">
                      <span className="font-mono text-[10px] text-[#2B7A19] block">{t.code}</span>
                      <span>{t.name.replace(' Partnership', '')}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEEC]">
              {visibleAttributes.map((attr) => (
                <tr key={attr.key} className="hover:bg-[#FAFBF9]">
                  <td className="py-3.5 px-5 text-sm font-semibold text-[#111312]">{attr.label}</td>
                  {visibleTypes.map((t) => (
                    <td key={t.slug} className="py-3.5 px-4">
                      <ComparisonCell value={t.comparison[attr.key] || 'Not Included'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {visibleTypes.map((t) => (
            <div key={t.slug} className="rounded-2xl border border-[#E6E8E6] bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#111312]">{t.name}</h3>
                <Link to={`/apply?type=${t.slug}`} className="text-xs font-semibold text-[#2B7A19]">
                  Apply →
                </Link>
              </div>
              <div className="divide-y divide-[#F0F2F0]">
                {visibleAttributes.map((attr) => (
                  <div key={attr.key} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-[#5A605C]">{attr.label}</span>
                    <ComparisonCell value={t.comparison[attr.key] || 'Not Included'} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WhatWeOfferPage() {
  const { bootstrap } = useApp();
  const benefits = bootstrap?.benefits || [];
  const [tierFilter, setTierFilter] = useState<'ALL' | 'CONFIRMED' | 'POTENTIAL' | 'NEGOTIABLE'>('ALL');

  const categories: Array<{
    key: 'TECHNOLOGY' | 'MARKETING' | 'BUSINESS' | 'COMMUNITY';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'TECHNOLOGY', label: 'Technology', icon: Server },
    { key: 'MARKETING', label: 'Marketing', icon: Megaphone },
    { key: 'BUSINESS', label: 'Business', icon: Briefcase },
    { key: 'COMMUNITY', label: 'Community', icon: Users },
  ];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHeader
            kicker="What HelzerX Offers"
            title="Transparent benefit tiers"
            accent="across four categories."
            subtitle="We clearly distinguish confirmed baseline partner benefits from potential or negotiable offerings evaluated per partnership scope."
          />

          <div className="flex items-center gap-1 p-1 bg-[#F4F6F4] rounded-xl border border-[#E6E8E6]">
            {(['ALL', 'CONFIRMED', 'POTENTIAL', 'NEGOTIABLE'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  tierFilter === tier ? 'bg-[#0D0F0E] text-white' : 'text-[#5A605C] hover:text-[#111312]'
                }`}
              >
                {tier === 'ALL' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const items = benefits.filter(
              (b) => b.category === cat.key && (tierFilter === 'ALL' || b.availability_tier === tierFilter)
            );
            if (items.length === 0) return null;
            return (
              <div key={cat.key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-[#111312]">{cat.label}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <h3 className="text-base font-bold text-[#111312]">{item.title}</h3>
                      </div>
                      <p className="text-sm text-[#5A605C] leading-relaxed mb-4">{item.description}</p>
                      <StatusIndicator status={item.availability_tier} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WhatWeExpectPage() {
  const { bootstrap } = useApp();
  const requirements = bootstrap?.requirements || [];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          kicker="What We Expect From Partners"
          title="Mutual standards for"
          accent="dependable collaboration."
          subtitle="Healthy partnerships rely on realistic, fair expectations upheld by both HelzerX Technologies and our partner organizations."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((req) => (
            <div key={req.id} className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono text-[#5A605C]">{req.category}</span>
                  <span className={req.is_mandatory ? 'font-semibold text-[#2B7A19]' : 'text-[#5A605C]'}>
                    {req.is_mandatory ? 'Core Expectation' : 'Recommended'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#111312]">{req.title}</h2>
                <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">{req.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-7 sm:p-9 space-y-4">
          <h2 className="text-xl font-bold text-[#111312]">Baseline Eligibility Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#4A504C]">
            {[
              'Verifiable organization identity, digital presence, or community leadership',
              'Clear alignment with at least one HelzerX division or partnership track',
              'Authorized representative able to communicate and execute agreements',
              'Compliance with applicable laws, privacy norms, and ethical standards',
            ].map((line) => (
              <p key={line} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2B7A19] shrink-0 mt-0.5" />
                <span>{line}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcessPage() {
  const workflowStatuses = [
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
  ];

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <SectionHeader
          kicker="Partnership Process"
          title="End-to-end application"
          accent="and onboarding workflow."
          subtitle="Every application follows a documented, auditable lifecycle inside the HelzerX Partnerships Portal."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {workflowStatuses.map((status, idx) => (
            <div key={status} className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-5">
              <span className="font-mono text-xs text-[#2B7A19] font-semibold">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-sm font-bold text-[#111312]">{status}</h3>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42]"
          >
            <span>Start Application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/request-meeting"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full border border-[#E2E5E2] hover:bg-[#F7F8F7]"
          >
            <span>Request an Introductory Meeting</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DirectoryPage() {
  const { bootstrap } = useApp();
  const directory = bootstrap?.directory || [];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set<string>();
    directory.forEach((d) => {
      if (d.public_category) set.add(d.public_category);
    });
    return Array.from(set);
  }, [directory]);

  const filtered = useMemo(() => {
    return directory.filter((item) => {
      const matchesCat = category === 'ALL' || item.public_category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [directory, category, query]);

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          kicker="Public Partner Directory"
          title="Approved HelzerX"
          accent="collaborating organizations."
          subtitle="Only organizations explicitly approved for public visibility by HelzerX administration appear in this directory. Private applicant records are never displayed."
        />

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#767D78] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search approved partners..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4D8D5] text-sm focus:outline-none focus:border-[#0D0F0E]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter partner category"
            className="px-4 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching public partners"
            description="No approved public listings match your current search criteria."
            action={
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-[#0D0F0E] text-white"
              >
                <span>Apply to Become a Partner</span>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-[#5A605C] flex items-center gap-2 mb-3">
                    <span className="font-semibold text-[#2B7A19]">
                      {partner.public_category || 'Partner'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{partner.country}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#111312]">{partner.name}</h2>
                  <p className="mt-2 text-sm text-[#5A605C] leading-relaxed">
                    {partner.collaboration_summary || partner.description}
                  </p>
                </div>

                {partner.website && (
                  <div className="mt-5 pt-4 border-t border-[#E6E8E6]">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111312] hover:text-[#2B7A19]"
                    >
                      <span>Visit Official Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
