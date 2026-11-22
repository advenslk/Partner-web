import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck2,
  List,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/UiPrimitives';

export function FaqPage() {
  const { bootstrap } = useApp();
  const faqs = bootstrap?.faqs || [];
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState('ALL');

  const categories = useMemo(() => {
    const s = new Set(faqs.map((f) => f.category));
    return Array.from(s);
  }, [faqs]);

  const filtered = faqs.filter((f) => category === 'ALL' || f.category === category);

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeader
          kicker="Frequently Asked Questions"
          title="Answers about HelzerX"
          accent="partnerships and governance."
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              category === 'ALL' ? 'bg-[#0D0F0E] text-white' : 'bg-[#F4F6F4] text-[#4A504C]'
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                category === cat ? 'bg-[#0D0F0E] text-white' : 'bg-[#F4F6F4] text-[#4A504C]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-[#E6E8E6] border-y border-[#E6E8E6]">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2B7A19] block mb-1">
                      {item.category}
                    </span>
                    <span className="text-base font-bold text-[#111312]">{item.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#5A605C] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm text-[#5A605C] leading-relaxed">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { bootstrap, apiFetch } = useApp();
  const contact = bootstrap?.content?.contact;
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch<{ message: string }>('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccessMsg(res.message);
      setForm({ name: '', email: '', organization: '', subject: '', message: '' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <SectionHeader
            kicker="Contact HelzerX"
            title="Speak with our"
            accent="partnerships desk."
            subtitle="Have a preliminary question before submitting a formal partnership proposal? Send us a message directly."
          />

          <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#2B7A19] mt-0.5" />
              <div>
                <p className="font-semibold text-[#111312]">Partnerships Email</p>
                <p className="text-[#5A605C]">{contact?.email || 'partnerships@helzerx.example'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#2B7A19] mt-0.5" />
              <div>
                <p className="font-semibold text-[#111312]">Typical Response Window</p>
                <p className="text-[#5A605C]">{contact?.responseWindow || '1–3 Business Days'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#2B7A19] mt-0.5" />
              <div>
                <p className="font-semibold text-[#111312]">Operations</p>
                <p className="text-[#5A605C]">{contact?.headquarters}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-7 sm:p-9 space-y-5"
          >
            {successMsg && (
              <div className="p-4 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111312] mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111312] mb-1.5">Business Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111312] mb-1.5">Organization</label>
                <input
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111312] mb-1.5">Subject *</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Message *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624] disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RequestMeetingPage() {
  const { apiFetch, user } = useApp();
  const [form, setForm] = useState({
    organizationName: '',
    contactPerson: user?.fullName || '',
    email: user?.email || '',
    preferredDate: '',
    preferredTime: '14:00 UTC',
    meetingType: 'Partnership Discovery Call',
    purpose: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrMsg('');
    setDoneMsg('');
    try {
      const res = await apiFetch<{ message: string }>('/api/public/meetings', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setDoneMsg(res.message);
      setForm({
        organizationName: '',
        contactPerson: user?.fullName || '',
        email: user?.email || '',
        preferredDate: '',
        preferredTime: '14:00 UTC',
        meetingType: 'Partnership Discovery Call',
        purpose: '',
      });
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Unable to schedule meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <SectionHeader
          kicker="Request a Meeting"
          title="Schedule a structured briefing"
          accent="with HelzerX."
          subtitle="Propose a preferred date and time. An administrator will review your request, confirm or propose an alternate slot, and attach a meeting link."
        />

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-7 sm:p-9 space-y-5"
        >
          {doneMsg && (
            <div className="p-4 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{doneMsg}</span>
            </div>
          )}
          {errMsg && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{errMsg}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Organization Name *</label>
              <input
                required
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Contact Person *</label>
              <input
                required
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Business Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Meeting Type *</label>
              <select
                value={form.meetingType}
                onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              >
                <option>Partnership Discovery Call</option>
                <option>Technical Architecture Briefing</option>
                <option>Marketing & Event Collaboration</option>
                <option>Agreement & Commercial Review</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Preferred Date *</label>
              <input
                required
                type="date"
                value={form.preferredDate}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1.5">Preferred Time (with Timezone) *</label>
              <input
                required
                value={form.preferredTime}
                onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                placeholder="e.g. 14:00 UTC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111312] mb-1.5">Meeting Purpose & Agenda *</label>
            <textarea
              required
              rows={4}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Outline the partnership topics, division alignment, or questions you would like to cover."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9EE855] text-[#0D0F0E] text-sm font-semibold hover:bg-[#8FDD42] disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            <span>{submitting ? 'Submitting Request...' : 'Request Meeting'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const LEGAL_KEY_MAP: Record<string, string> = {
  privacy: 'legal_privacy',
  terms: 'legal_terms',
  'partnership-terms': 'legal_partnership_terms',
  aup: 'legal_aup',
  'data-handling': 'legal_data_handling',
  cookies: 'legal_cookies',
  nda: 'legal_nda',
};

export function LegalPage({ defaultSlug }: { defaultSlug?: string }) {
  const { docSlug } = useParams();
  const { bootstrap, user, apiFetch } = useApp();
  const resolvedSlug = defaultSlug || docSlug || 'privacy';
  const dbKey = LEGAL_KEY_MAP[resolvedSlug] || 'legal_privacy';
  const doc = bootstrap?.legal?.[dbKey];

  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [ackEmail, setAckEmail] = useState('');
  const [ackOrg, setAckOrg] = useState('');
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [ackMessage, setAckMessage] = useState('');
  const [ackError, setAckError] = useState('');

  React.useEffect(() => {
    setAckMessage('');
    setAckError('');
    setMobileTocOpen(false);
  }, [resolvedSlug]);

  const navItems = [
    { slug: 'privacy', label: 'Privacy Policy' },
    { slug: 'terms', label: 'Terms of Service' },
    { slug: 'partnership-terms', label: 'Partnership Terms' },
    { slug: 'aup', label: 'Acceptable Use' },
    { slug: 'data-handling', label: 'Data Handling' },
    { slug: 'cookies', label: 'Cookie Policy' },
    { slug: 'nda', label: 'NDA Information' },
  ];

  const handleRecordAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAckSubmitting(true);
    setAckMessage('');
    setAckError('');
    try {
      const res = await apiFetch<{ message: string; acceptanceId: string }>(
        `/api/public/legal/${resolvedSlug}/accept`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: user?.email || ackEmail || undefined,
            organizationName: ackOrg || undefined,
            context: 'LEGAL_PORTAL_ACKNOWLEDGMENT',
          }),
        }
      );
      setAckMessage(`${res.message} Reference: ${res.acceptanceId.slice(0, 8).toUpperCase()}`);
    } catch (error) {
      setAckError(error instanceof Error ? error.message : 'Unable to record acknowledgment.');
    } finally {
      setAckSubmitting(false);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return 'Pending Formal Publication';
    return iso.slice(0, 10);
  };

  return (
    <div className="py-12 lg:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Preserved 7 Legal Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#ECEEEC] pb-4">
          {navItems.map((n) => (
            <Link
              key={n.slug}
              to={`/legal/${n.slug}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                resolvedSlug === n.slug
                  ? 'bg-[#0D0F0E] text-white'
                  : 'bg-[#F4F6F4] text-[#4A504C] hover:text-[#111312]'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Clear Draft / Legal Review Notice */}
        <div
          className={`rounded-2xl border p-4 flex items-start gap-3 text-xs ${
            doc?.status === 'PUBLISHED'
              ? 'border-[#C8DFB4] bg-[#F4FBE9] text-[#1D5610]'
              : 'border-[#F59E0B]/40 bg-amber-50 text-amber-950'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              doc?.status === 'PUBLISHED' ? 'text-[#2B7A19]' : 'text-amber-700'
            }`}
          />
          <div className="leading-relaxed">
            <strong className="uppercase tracking-wide mr-1.5">
              {doc?.status === 'PUBLISHED' ? 'Published Governance Notice:' : 'Draft / Legal Review Notice:'}
            </strong>
            <span>
              {doc?.legalReviewNotice ||
                'Draft governance template prepared for legal counsel review. Company-specific registration particulars remain configurable until published.'}
            </span>
          </div>
        </div>

        {!doc ? (
          <div className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-8 text-sm text-[#5A605C]">
            Loading legal governance document...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Table of Contents — Mobile Collapsible + Desktop Sticky Sidebar */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-5">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-left lg:cursor-default"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#111312]">
                    <List className="w-4 h-4 text-[#2B7A19]" />
                    <span>Table of Contents</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#5A605C] lg:hidden transition-transform ${
                      mobileTocOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <nav
                  aria-label="Document sections"
                  className={`mt-4 space-y-2 ${mobileTocOpen ? 'block' : 'hidden lg:block'}`}
                >
                  {doc.sections.map((sec) => (
                    <div key={sec.id} className="space-y-1">
                      <a
                        href={`#${sec.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className="block text-xs font-semibold text-[#262A28] hover:text-[#2B7A19] py-1 transition-colors"
                      >
                        <span className="font-mono text-[#2B7A19] mr-1.5 tabular-nums">{sec.number}.</span>
                        {sec.title}
                      </a>
                      {sec.subsections && sec.subsections.length > 0 && (
                        <div className="pl-4 border-l border-[#E2E5E2] space-y-1">
                          {sec.subsections.map((sub) => (
                            <a
                              key={`${sec.id}-${sub.number}`}
                              href={`#${sec.id}-${sub.number.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              onClick={() => setMobileTocOpen(false)}
                              className="block text-[11px] text-[#5A605C] hover:text-[#111312] py-0.5 transition-colors"
                            >
                              <span className="font-mono mr-1.5 tabular-nums">{sub.number}</span>
                              {sub.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="rounded-2xl border border-[#E6E8E6] bg-[#FAFBF9] p-5 space-y-3">
                <p className="text-xs font-bold text-[#111312]">Offline Copy & Compliance</p>
                <p className="text-xs text-[#5A605C] leading-relaxed">
                  Download a formatted PDF copy of this {doc.status === 'PUBLISHED' ? 'published' : 'draft'} governance document for internal legal review or archiving.
                </p>
                <a
                  href={`/api/public/legal/${resolvedSlug}/pdf`}
                  download
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold hover:bg-[#222624] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF (v{doc.version})</span>
                </a>
              </div>
            </aside>

            {/* Full Structured Legal Document Body */}
            <div className="lg:col-span-8 space-y-6">
              <article className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 sm:p-10 space-y-8">
                <header className="border-b border-[#E6E8E6] pb-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#2B7A19]">
                        HelzerX Corporate Partnerships Governance
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#111312] tracking-tight">
                        {doc.title}
                      </h1>
                      <p className="text-sm text-[#4A504C] leading-relaxed">{doc.subtitle}</p>
                    </div>
                    <a
                      href={`/api/public/legal/${resolvedSlug}/pdf`}
                      download
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold hover:bg-[#8FDD42] shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>

                  {/* Unboxed Document Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-[#4A504C] tabular-nums">
                    <span>
                      Version: <strong className="font-mono text-[#111312]">{doc.version}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Status:{' '}
                      <strong className={doc.status === 'PUBLISHED' ? 'text-[#2B7A19]' : 'text-amber-800'}>
                        {doc.status === 'PUBLISHED' ? 'Published' : 'Draft (Pending Legal Review)'}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Published: <strong className="text-[#111312]">{formatDate(doc.publishedAt)}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Last Updated: <strong className="text-[#111312]">{formatDate(doc.lastUpdatedAt)}</strong>
                    </span>
                  </div>
                </header>

                {/* Numbered Sections & Subsections */}
                <div className="space-y-9">
                  {doc.sections.map((section) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 space-y-4 border-b border-[#ECEEEC] pb-7 last:border-b-0 last:pb-0"
                    >
                      <h2 className="text-lg sm:text-xl font-bold text-[#111312] flex items-baseline gap-2">
                        <span className="font-mono text-[#2B7A19] tabular-nums">{section.number}.</span>
                        <span>{section.title}</span>
                      </h2>

                      {section.paragraphs &&
                        section.paragraphs.map((para, pIdx) => (
                          <p key={pIdx} className="text-sm text-[#373C39] leading-relaxed">
                            {para}
                          </p>
                        ))}

                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="space-y-2 pl-5 list-disc marker:text-[#2B7A19]">
                          {section.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-sm text-[#373C39] leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {section.subsections && section.subsections.length > 0 && (
                        <div className="space-y-5 pt-2 pl-3 sm:pl-5 border-l-2 border-[#E2E5E2]">
                          {section.subsections.map((sub) => (
                            <div
                              key={`${section.id}-${sub.number}`}
                              id={`${section.id}-${sub.number.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              className="scroll-mt-24 space-y-2.5"
                            >
                              <h3 className="text-sm sm:text-base font-bold text-[#111312] flex items-baseline gap-2">
                                <span className="font-mono text-[#2B7A19] text-xs sm:text-sm tabular-nums">
                                  {sub.number}
                                </span>
                                <span>{sub.title}</span>
                              </h3>
                              {sub.paragraphs &&
                                sub.paragraphs.map((sp, spIdx) => (
                                  <p key={spIdx} className="text-sm text-[#4A504C] leading-relaxed">
                                    {sp}
                                  </p>
                                ))}
                              {sub.bullets && sub.bullets.length > 0 && (
                                <ul className="space-y-1.5 pl-5 list-disc marker:text-[#5A605C]">
                                  {sub.bullets.map((sb, sbIdx) => (
                                    <li key={sbIdx} className="text-sm text-[#4A504C] leading-relaxed">
                                      {sb}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </article>

              {/* Policy Acknowledgment Audit Control */}
              <form
                onSubmit={handleRecordAcceptance}
                className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 sm:p-8 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <FileCheck2 className="w-5 h-5 text-[#2B7A19] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-base font-bold text-[#111312]">
                      Record Policy Acknowledgment
                    </h2>
                    <p className="text-xs text-[#5A605C] mt-0.5 leading-relaxed">
                      Confirm that you have reviewed {doc.title} (Version {doc.version}). Policy acceptances are also logged automatically during partner registration and partnership application submission.
                    </p>
                  </div>
                </div>

                {ackMessage && (
                  <div className="p-3.5 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{ackMessage}</span>
                  </div>
                )}
                {ackError && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                    {ackError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!user && (
                    <div>
                      <label className="block text-xs font-semibold text-[#111312] mb-1">
                        Business Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={ackEmail}
                        onChange={(e) => setAckEmail(e.target.value)}
                        placeholder="representative@organization.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] bg-white text-xs"
                      />
                    </div>
                  )}
                  <div className={user ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-[#111312] mb-1">
                      Organization Name (Optional)
                    </label>
                    <input
                      value={ackOrg}
                      onChange={(e) => setAckOrg(e.target.value)}
                      placeholder="Organization or brand name"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-[#5A605C]">
                    {user
                      ? `Recording as ${user.email} · Version ${doc.version}`
                      : `Version ${doc.version} acknowledgment`}
                  </span>
                  <button
                    type="submit"
                    disabled={ackSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold hover:bg-[#222624] disabled:opacity-50"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>
                      {ackSubmitting ? 'Recording...' : `Acknowledge ${doc.tabLabel}`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
