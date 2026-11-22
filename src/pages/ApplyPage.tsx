import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/UiPrimitives';

const STEPS = [
  'Organization',
  'Contact',
  'Partnership Type',
  'Proposal',
  'Documents',
  'Review & Submit',
];

export default function ApplyPage() {
  const { bootstrap, user, apiFetch } = useApp();
  const [searchParams] = useSearchParams();
  const partnershipTypes = bootstrap?.partnershipTypes || [];

  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const [form, setForm] = useState({
    organizationName: '',
    organizationType: 'Technology Company',
    country: '',
    website: '',
    organizationDescription: '',
    yearEstablished: '',
    linkedinUrl: '',
    xUrl: '',
    discordInvite: '',
    contactPerson: user?.fullName || '',
    contactPosition: '',
    contactEmail: user?.email || '',
    discordUsername: '',
    phoneNumber: '',
    partnershipTypeSlug: searchParams.get('type') || 'strategic',
    whyPartner: '',
    whatCanOffer: '',
    whatExpect: '',
    objectives: '',
    resourcesContributed: '',
    expectedDuration: '12 Months',
    additionalInfo: '',
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [files, setFiles] = useState<{
    companyProfile: File | null;
    businessProposal: File | null;
    supportingDocuments: File | null;
    portfolio: File | null;
  }>({
    companyProfile: null,
    businessProposal: null,
    supportingDocuments: null,
    portfolio: null,
  });

  useEffect(() => {
    const paramType = searchParams.get('type');
    if (paramType && partnershipTypes.some((p) => p.slug === paramType)) {
      setForm((prev) => ({ ...prev, partnershipTypeSlug: paramType }));
    }
  }, [searchParams, partnershipTypes]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactPerson: prev.contactPerson || user.fullName,
        contactEmail: prev.contactEmail || user.email,
      }));
    }
  }, [user]);

  const validateStep = (): string | null => {
    if (step === 0) {
      if (form.organizationName.trim().length < 2) return 'Organization name is required.';
      if (form.country.trim().length < 2) return 'Country is required.';
      if (form.organizationDescription.trim().length < 10)
        return 'Please provide at least 10 characters describing your organization.';
    } else if (step === 1) {
      if (form.contactPerson.trim().length < 2) return 'Contact person name is required.';
      if (form.contactPosition.trim().length < 2) return 'Position / role is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()))
        return 'Please enter a valid business email address.';
    } else if (step === 2) {
      if (!form.partnershipTypeSlug) return 'Please select a partnership type.';
    } else if (step === 3) {
      if (form.whyPartner.trim().length < 10) return 'Please explain why you want to partner with HelzerX.';
      if (form.whatCanOffer.trim().length < 10) return 'Please explain what your organization can offer.';
      if (form.whatExpect.trim().length < 10) return 'Please outline what you expect from HelzerX.';
      if (form.objectives.trim().length < 10) return 'Please specify your collaboration objectives.';
      if (form.resourcesContributed.trim().length < 3) return 'Please specify resources you can contribute.';
    } else if (step === 5) {
      if (!form.termsAccepted || !form.privacyAccepted)
        return 'Please accept both the Privacy Policy and Application Terms before submitting.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('organizationName', form.organizationName);
      fd.append('organizationType', form.organizationType);
      fd.append('country', form.country);
      fd.append('website', form.website);
      fd.append('organizationDescription', form.organizationDescription);
      fd.append('yearEstablished', form.yearEstablished);
      fd.append(
        'socialLinks',
        JSON.stringify({
          linkedin: form.linkedinUrl,
          x: form.xUrl,
          discord: form.discordInvite,
        })
      );
      fd.append('contactPerson', form.contactPerson);
      fd.append('contactPosition', form.contactPosition);
      fd.append('contactEmail', form.contactEmail);
      fd.append('discordUsername', form.discordUsername);
      fd.append('phoneNumber', form.phoneNumber);
      fd.append('partnershipTypeSlug', form.partnershipTypeSlug);
      fd.append('whyPartner', form.whyPartner);
      fd.append('whatCanOffer', form.whatCanOffer);
      fd.append('whatExpect', form.whatExpect);
      fd.append('objectives', form.objectives);
      fd.append('resourcesContributed', form.resourcesContributed);
      fd.append('expectedDuration', form.expectedDuration);
      fd.append('additionalInfo', form.additionalInfo);
      fd.append('termsAccepted', String(form.termsAccepted));
      fd.append('privacyAccepted', String(form.privacyAccepted));

      if (files.companyProfile) fd.append('companyProfile', files.companyProfile);
      if (files.businessProposal) fd.append('businessProposal', files.businessProposal);
      if (files.supportingDocuments) fd.append('supportingDocuments', files.supportingDocuments);
      if (files.portfolio) fd.append('portfolio', files.portfolio);

      const res = await apiFetch<{ referenceId: string }>('/api/public/applications', {
        method: 'POST',
        body: fd,
      });

      setSubmittedRef(res.referenceId);
    } catch (submitErr) {
      setErrorMsg(submitErr instanceof Error ? submitErr.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-8 sm:p-12 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#9EE855] text-[#0D0F0E] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2B7A19]">
                Application Confirmed
              </p>
              <h1 className="mt-2 text-3xl font-bold text-[#111312]">
                Proposal Successfully Submitted
              </h1>
              <p className="mt-3 text-sm text-[#5A605C]">
                Your application has been recorded in the HelzerX Corporate Partnerships system and a confirmation notice has been queued for{' '}
                <strong className="text-[#111312]">{form.contactEmail}</strong>.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0D0F0E] text-white p-6">
              <p className="text-xs uppercase tracking-wider text-[#A7ADA9]">
                Application Reference ID
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#9EE855] tabular-nums">
                {submittedRef}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to={user ? '/portal/status' : '/register'}
                className="px-6 py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624]"
              >
                {user ? 'Track in Partner Portal' : 'Create Partner Account to Track'}
              </Link>
              <Link
                to="/"
                className="px-6 py-3 rounded-full border border-[#D4D8D5] bg-white text-sm font-semibold hover:bg-[#F7F8F7]"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedType = partnershipTypes.find((p) => p.slug === form.partnershipTypeSlug);

  return (
    <div className="py-14 lg:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <SectionHeader
          kicker="Partnership Application"
          title="Submit your formal"
          accent="collaboration proposal."
          subtitle="Complete the six structured steps below. Upon submission, you will receive a unique application reference ID."
        />

        {/* Step Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (idx < step) setStep(idx);
              }}
              className={`px-3 py-2.5 rounded-xl text-left border transition-colors ${
                idx === step
                  ? 'border-[#0D0F0E] bg-[#0D0F0E] text-white'
                  : idx < step
                  ? 'border-[#C8DFB4] bg-[#E9FAD6] text-[#1D5610]'
                  : 'border-[#E6E8E6] bg-[#FAFBF9] text-[#5A605C]'
              }`}
            >
              <span className="font-mono text-[10px] block">0{idx + 1}</span>
              <span className="text-xs font-semibold truncate block">{label}</span>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#E6E8E6] bg-[#FAFBF9] p-6 sm:p-10 space-y-6"
        >
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#111312]">Step 1: Organization Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Organization Name *</label>
                  <input
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Organization Type *</label>
                  <select
                    value={form.organizationType}
                    onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  >
                    <option>Technology Company</option>
                    <option>Hosting Provider</option>
                    <option>Gaming Community / Network</option>
                    <option>Digital Agency / Studio</option>
                    <option>Software Vendor / Developer</option>
                    <option>Content Creator / Media</option>
                    <option>Non-Profit / Academic</option>
                    <option>Other Organization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Country / Region *</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Official Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Year Established (Optional)</label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={form.yearEstablished}
                    onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">LinkedIn / X / Discord Link</label>
                  <input
                    placeholder="https://..."
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Organization Description *</label>
                <textarea
                  rows={4}
                  value={form.organizationDescription}
                  onChange={(e) => setForm({ ...form, organizationDescription: e.target.value })}
                  placeholder="Describe your organization's core products, community, or services."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#111312]">Step 2: Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Contact Person *</label>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Position / Title *</label>
                  <input
                    value={form.contactPosition}
                    onChange={(e) => setForm({ ...form, contactPosition: e.target.value })}
                    placeholder="e.g. Head of Partnerships"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Business Email *</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Discord Username (Optional)</label>
                  <input
                    value={form.discordUsername}
                    onChange={(e) => setForm({ ...form, discordUsername: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Phone Number (Optional)</label>
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#111312]">Step 3: Partnership Selection</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partnershipTypes.map((pt) => {
                  const active = form.partnershipTypeSlug === pt.slug;
                  return (
                    <button
                      key={pt.slug}
                      type="button"
                      onClick={() => setForm({ ...form, partnershipTypeSlug: pt.slug })}
                      className={`text-left p-5 rounded-2xl border transition-colors ${
                        active
                          ? 'border-[#0D0F0E] bg-[#0D0F0E] text-white'
                          : 'border-[#E2E5E2] bg-white hover:border-[#0D0F0E]'
                      }`}
                    >
                      <span
                        className={`font-mono text-xs font-semibold ${
                          active ? 'text-[#9EE855]' : 'text-[#2B7A19]'
                        }`}
                      >
                        {pt.code}
                      </span>
                      <p className="mt-1 font-bold text-base">{pt.name}</p>
                      <p className={`mt-1 text-xs ${active ? 'text-[#C4C9C6]' : 'text-[#5A605C]'}`}>
                        {pt.shortDescription}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#111312]">Step 4: Partnership Proposal</h2>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Why do you want to partner with HelzerX? *
                </label>
                <textarea
                  rows={3}
                  value={form.whyPartner}
                  onChange={(e) => setForm({ ...form, whyPartner: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    What can your organization offer? *
                  </label>
                  <textarea
                    rows={3}
                    value={form.whatCanOffer}
                    onChange={(e) => setForm({ ...form, whatCanOffer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    What do you expect from HelzerX? *
                  </label>
                  <textarea
                    rows={3}
                    value={form.whatExpect}
                    onChange={(e) => setForm({ ...form, whatExpect: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  What are your collaboration objectives? *
                </label>
                <textarea
                  rows={3}
                  value={form.objectives}
                  onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    What resources can you contribute? *
                  </label>
                  <input
                    value={form.resourcesContributed}
                    onChange={(e) => setForm({ ...form, resourcesContributed: e.target.value })}
                    placeholder="e.g. Engineering hours, community channels, infrastructure"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Expected collaboration duration *
                  </label>
                  <select
                    value={form.expectedDuration}
                    onChange={(e) => setForm({ ...form, expectedDuration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                  >
                    <option>3 Months (Pilot)</option>
                    <option>6 Months</option>
                    <option>12 Months</option>
                    <option>Multi-Year Strategic</option>
                    <option>Single Event / Project</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Additional Information (Optional)</label>
                <textarea
                  rows={2}
                  value={form.additionalInfo}
                  onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] bg-white text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#111312]">Step 5: Optional Supporting Documents</h2>
                <p className="text-xs text-[#5A605C] mt-1">
                  Allowed formats: PDF, DOCX, PNG, JPG, TXT, ZIP (max 10 MB per file). Files are stored privately and never exposed publicly.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ['companyProfile', 'Company Profile'],
                    ['businessProposal', 'Business Proposal'],
                    ['supportingDocuments', 'Supporting Documents'],
                    ['portfolio', 'Portfolio / Deck'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="block rounded-2xl border border-dashed border-[#C5CBC7] bg-white p-5 cursor-pointer hover:border-[#0D0F0E]"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-[#111312] mb-2">
                      <FileUp className="w-4 h-4 text-[#2B7A19]" />
                      <span>{label}</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                      onChange={(e) =>
                        setFiles((prev) => ({
                          ...prev,
                          [key]: e.target.files?.[0] || null,
                        }))
                      }
                      className="text-xs text-[#5A605C] w-full"
                    />
                    {files[key] && (
                      <p className="mt-2 text-xs font-semibold text-[#2B7A19] truncate">
                        Selected: {files[key]?.name}
                      </p>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#111312]">Step 6: Review & Submit</h2>
              <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#5A605C]">Organization</p>
                    <p className="font-semibold text-[#111312]">{form.organizationName}</p>
                    <p className="text-xs text-[#5A605C]">
                      {form.organizationType} · {form.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5A605C]">Primary Contact</p>
                    <p className="font-semibold text-[#111312]">
                      {form.contactPerson} ({form.contactPosition})
                    </p>
                    <p className="text-xs text-[#5A605C]">{form.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5A605C]">Selected Track</p>
                    <p className="font-semibold text-[#2B7A19]">{selectedType?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5A605C]">Expected Duration</p>
                    <p className="font-semibold text-[#111312]">{form.expectedDuration}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#ECEEEC] space-y-2 text-xs text-[#4A504C]">
                  <p>
                    <strong>Motivation:</strong> {form.whyPartner}
                  </p>
                  <p>
                    <strong>Contribution:</strong> {form.whatCanOffer}
                  </p>
                  <p>
                    <strong>Objectives:</strong> {form.objectives}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#373C39]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.privacyAccepted}
                    onChange={(e) => setForm({ ...form, privacyAccepted: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    I acknowledge the{' '}
                    <Link to="/legal/privacy" target="_blank" className="underline font-semibold">
                      Privacy Policy (Draft)
                    </Link>{' '}
                    and consent to HelzerX processing these application details for evaluation.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    I accept the{' '}
                    <Link to="/legal/terms" target="_blank" className="underline font-semibold">
                      Application & Partnership Terms (Draft)
                    </Link>{' '}
                    and confirm all submitted details are accurate.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-[#E6E8E6] flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep((s) => s - 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#D4D8D5] bg-white text-sm font-semibold hover:bg-[#F7F8F7]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9EE855] text-[#0D0F0E] text-sm font-semibold hover:bg-[#8FDD42] disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Submitting Proposal...' : 'Submit Application'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
