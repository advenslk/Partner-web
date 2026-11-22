import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CmsResponse {
  content: Array<{ key: string; section: string; title: string; content_json: string; updated_at: string }>;
  faqs: Array<{ id: string; category: string; question: string; answer: string }>;
  partnershipTypes: Array<{
    slug: string;
    code: string;
    name: string;
    short_description: string;
    overview: string;
    comparison_attributes_json: string;
    is_active: number;
  }>;
  benefits: Array<{
    id: string;
    category: 'TECHNOLOGY' | 'MARKETING' | 'BUSINESS' | 'COMMUNITY';
    title: string;
    description: string;
    availability_tier: 'CONFIRMED' | 'POTENTIAL' | 'NEGOTIABLE';
    is_active: number;
  }>;
  emailTemplates: Array<{ key: string; name: string; subject: string; html_body: string; is_active: number }>;
  outbox: Array<{
    id: string;
    recipient_email: string;
    template_key: string | null;
    subject: string;
    delivery_status: string;
    created_at: string;
  }>;
  contactInquiries: Array<{
    id: string;
    name: string;
    email: string;
    organization: string | null;
    subject: string;
    message: string;
    created_at: string;
  }>;
}

export function AdminContentManagerView() {
  const { apiFetch, refreshBootstrap } = useApp();
  const [cms, setCms] = useState<CmsResponse | null>(null);
  const [selectedKey, setSelectedKey] = useState('hero');
  const [editorJson, setEditorJson] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [faqForm, setFaqForm] = useState({ category: 'Applications', question: '', answer: '' });
  const [selectedTplKey, setSelectedTplKey] = useState('application_confirmation');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');

  const load = useCallback(async () => {
    const res = await apiFetch<CmsResponse>('/api/admin/cms');
    setCms(res);
    const active = res.content.find((c) => c.key === selectedKey) || res.content[0];
    if (active) {
      setEditorTitle(active.title);
      try {
        setEditorJson(JSON.stringify(JSON.parse(active.content_json), null, 2));
      } catch {
        setEditorJson(active.content_json);
      }
    }
    const tpl = res.emailTemplates.find((t) => t.key === selectedTplKey) || res.emailTemplates[0];
    if (tpl) {
      setTplSubject(tpl.subject);
      setTplBody(tpl.html_body);
    }
  }, [apiFetch, selectedKey, selectedTplKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      JSON.parse(editorJson);
      await apiFetch(`/api/admin/cms/content/${selectedKey}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editorTitle, contentJson: editorJson }),
      });
      await refreshBootstrap();
      setMsg(`Saved "${selectedKey}" content and updated live portal.`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Invalid JSON or save error.');
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/cms/faqs', { method: 'POST', body: JSON.stringify(faqForm) });
    setFaqForm({ category: 'Applications', question: '', answer: '' });
    await refreshBootstrap();
    await load();
  };

  const handleDeleteFaq = async (id: string) => {
    await apiFetch(`/api/admin/cms/faqs/${id}`, { method: 'DELETE' });
    await refreshBootstrap();
    await load();
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch(`/api/admin/cms/email-templates/${selectedTplKey}`, {
      method: 'PUT',
      body: JSON.stringify({ subject: tplSubject, htmlBody: tplBody }),
    });
    setMsg(`Email template "${selectedTplKey}" updated.`);
    await load();
  };

  if (!cms) return <div className="p-6 text-sm text-[#5A605C]">Loading CMS...</div>;

  return (
    <div className="space-y-8">
      {msg && (
        <div className="p-3.5 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}
      {err && <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}

      {/* Website Sections & Legal Drafts */}
      <form onSubmit={handleSaveContent} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#111312]">Website & Legal Content Editor</h2>
            <p className="text-xs text-[#5A605C]">
              Edit homepage copy, company info, divisions, contact info, case studies, and legal drafts without code changes.
            </p>
          </div>
          <select
            value={selectedKey}
            onChange={(e) => {
              const k = e.target.value;
              setSelectedKey(k);
              const found = cms.content.find((c) => c.key === k);
              if (found) {
                setEditorTitle(found.title);
                setEditorJson(JSON.stringify(JSON.parse(found.content_json), null, 2));
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs font-semibold bg-white"
          >
            {cms.content.map((c) => (
              <option key={c.key} value={c.key}>
                {c.section.toUpperCase()} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Section Title</label>
          <input
            value={editorTitle}
            onChange={(e) => setEditorTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Structured Content Payload (JSON)</label>
          <textarea
            rows={12}
            value={editorJson}
            onChange={(e) => setEditorJson(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] font-mono text-xs bg-[#FAFBF9]"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold hover:bg-[#222624]"
        >
          Publish Content Update
        </button>
      </form>

      {/* FAQ Management */}
      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-5">
        <h2 className="text-lg font-bold text-[#111312]">FAQ Management</h2>
        <form onSubmit={handleAddFaq} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold mb-1">Category</label>
            <input
              required
              value={faqForm.category}
              onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold mb-1">Question</label>
            <input
              required
              value={faqForm.question}
              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold mb-1">Answer</label>
            <input
              required
              value={faqForm.answer}
              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
          </div>
          <button
            type="submit"
            className="md:col-span-1 py-2 px-3 rounded-xl bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold flex items-center justify-center"
            title="Add FAQ"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="divide-y divide-[#ECEEEC]">
          {cms.faqs.map((f) => (
            <div key={f.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div>
                <span className="font-semibold text-[#2B7A19]">{f.category}</span>
                <p className="font-bold text-[#111312]">{f.question}</p>
                <p className="text-[#5A605C]">{f.answer}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFaq(f.id)}
                className="p-1.5 rounded-lg border border-[#E2E5E2] text-red-700 hover:bg-red-50"
                aria-label="Delete FAQ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Templates & Outbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveTemplate} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#111312]">Email Templates</h2>
            <select
              value={selectedTplKey}
              onChange={(e) => {
                const k = e.target.value;
                setSelectedTplKey(k);
                const t = cms.emailTemplates.find((item) => item.key === k);
                if (t) {
                  setTplSubject(t.subject);
                  setTplBody(t.html_body);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-[#D4D8D5] text-xs"
            >
              {cms.emailTemplates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <input
            value={tplSubject}
            onChange={(e) => setTplSubject(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs"
          />
          <textarea
            rows={6}
            value={tplBody}
            onChange={(e) => setTplBody(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] font-mono text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold"
          >
            Save Email Template
          </button>
        </form>

        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
          <h2 className="text-base font-bold text-[#111312]">Recent Email Outbox & Inquiries</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {cms.outbox.map((o) => (
              <div key={o.id} className="p-3 rounded-xl bg-[#FAFBF9] border border-[#ECEEEC] text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-[#111312]">{o.recipient_email}</strong>
                  <span className="font-mono text-[10px] text-[#2B7A19]">{o.delivery_status}</span>
                </div>
                <p className="text-[#5A605C] truncate">{o.subject}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPartnershipTypesView() {
  const { apiFetch, refreshBootstrap } = useApp();
  const [types, setTypes] = useState<CmsResponse['partnershipTypes']>([]);
  const [selectedSlug, setSelectedSlug] = useState('strategic');
  const [overview, setOverview] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [comparison, setComparison] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await apiFetch<CmsResponse>('/api/admin/cms');
    setTypes(res.partnershipTypes);
    const active = res.partnershipTypes.find((t) => t.slug === selectedSlug) || res.partnershipTypes[0];
    if (active) {
      setOverview(active.overview);
      setShortDesc(active.short_description);
      setComparison(JSON.parse(active.comparison_attributes_json));
    }
  }, [apiFetch, selectedSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch(`/api/admin/cms/partnership-types/${selectedSlug}`, {
      method: 'PUT',
      body: JSON.stringify({
        shortDescription: shortDesc,
        overview,
        comparison,
      }),
    });
    await refreshBootstrap();
    setMsg(`Updated ${selectedSlug} partnership configuration & comparison matrix.`);
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111312]">Partnership Type & Comparison Matrix Editor</h2>
          <p className="text-xs text-[#5A605C]">Configure partnership descriptions and comparison values.</p>
        </div>
        <select
          value={selectedSlug}
          onChange={(e) => {
            const s = e.target.value;
            setSelectedSlug(s);
            const t = types.find((item) => item.slug === s);
            if (t) {
              setOverview(t.overview);
              setShortDesc(t.short_description);
              setComparison(JSON.parse(t.comparison_attributes_json));
            }
          }}
          className="px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs font-semibold"
        >
          {types.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>
      </div>

      {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium">{msg}</div>}

      <div>
        <label className="block text-xs font-semibold mb-1">Short Tagline</label>
        <input
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Overview</label>
        <textarea
          rows={3}
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-sm"
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#5A605C] mb-3">
          Comparison Matrix Values
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(comparison).map(([k, val]) => (
            <div key={k} className="p-3 rounded-xl border border-[#ECEEEC] bg-[#FAFBF9]">
              <label className="block text-xs font-semibold text-[#111312] mb-1">{k}</label>
              <select
                value={val}
                onChange={(e) => setComparison({ ...comparison, [k]: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D4D8D5] text-xs bg-white"
              >
                <option>Available</option>
                <option>Optional</option>
                <option>Negotiable</option>
                <option>Not Included</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold"
      >
        Save Partnership Track
      </button>
    </form>
  );
}

export function AdminBenefitsManagerView() {
  const { apiFetch, refreshBootstrap } = useApp();
  const [benefits, setBenefits] = useState<CmsResponse['benefits']>([]);
  const [form, setForm] = useState({
    category: 'TECHNOLOGY',
    title: '',
    description: '',
    availabilityTier: 'POTENTIAL',
  });

  const load = useCallback(async () => {
    const res = await apiFetch<CmsResponse>('/api/admin/cms');
    setBenefits(res.benefits);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/cms/benefits', { method: 'POST', body: JSON.stringify(form) });
    setForm({ category: 'TECHNOLOGY', title: '', description: '', availabilityTier: 'POTENTIAL' });
    await refreshBootstrap();
    await load();
  };

  const changeTier = async (id: string, tier: string) => {
    await apiFetch(`/api/admin/cms/benefits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityTier: tier }),
    });
    await refreshBootstrap();
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#111312]">Add Partnership Benefit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            <option value="TECHNOLOGY">TECHNOLOGY</option>
            <option value="MARKETING">MARKETING</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="COMMUNITY">COMMUNITY</option>
          </select>
          <input
            required
            placeholder="Benefit Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
          />
          <select
            value={form.availabilityTier}
            onChange={(e) => setForm({ ...form, availabilityTier: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="POTENTIAL">POTENTIAL</option>
            <option value="NEGOTIABLE">NEGOTIABLE</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold"
          >
            Add Benefit
          </button>
        </div>
        <input
          required
          placeholder="Description of benefit scope..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
        />
      </form>

      <div className="rounded-2xl border border-[#E6E8E6] bg-white divide-y divide-[#ECEEEC]">
        {benefits.map((b) => (
          <div key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-mono text-[#2B7A19] font-semibold mr-2">{b.category}</span>
              <strong className="text-sm text-[#111312]">{b.title}</strong>
              <p className="text-[#5A605C] mt-0.5">{b.description}</p>
            </div>
            <select
              value={b.availability_tier}
              onChange={(e) => changeTier(b.id, e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#D4D8D5] font-semibold bg-white"
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="POTENTIAL">POTENTIAL</option>
              <option value="NEGOTIABLE">NEGOTIABLE</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
