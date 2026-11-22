import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  History,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LegalSection, LegalSubsection } from '../types/portal';

interface AdminLegalDocRow {
  key: string;
  slug: string;
  tab_label: string;
  title: string;
  subtitle: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  legal_review_notice: string;
  published_at: string | null;
  last_updated_at: string;
  sections_json: string;
  draft_title: string;
  draft_subtitle: string;
  draft_version: string;
  draft_legal_review_notice: string;
  draft_sections_json: string;
}

interface AdminLegalVersionRow {
  id: string;
  document_key: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  title: string;
  subtitle: string;
  legal_review_notice: string;
  sections_json: string;
  change_note: string | null;
  created_by_email: string | null;
  created_at: string;
}

interface AdminLegalAcceptanceRow {
  id: string;
  user_email: string | null;
  organization_name: string | null;
  application_id: string | null;
  document_key: string;
  document_title: string;
  document_version: string;
  context: string;
  ip_address: string | null;
  accepted_at: string;
}

interface AdminLegalResponse {
  documents: AdminLegalDocRow[];
  versions: AdminLegalVersionRow[];
  acceptances: AdminLegalAcceptanceRow[];
}

function parseSectionsSafe(raw: string): LegalSection[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AdminLegalEditor() {
  const { apiFetch, refreshBootstrap, user } = useApp();
  const [data, setData] = useState<AdminLegalResponse | null>(null);
  const [selectedKey, setSelectedKey] = useState('legal_privacy');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [version, setVersion] = useState('');
  const [legalReviewNotice, setLegalReviewNotice] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'history' | 'acceptances'>('editor');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const canPublish = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const hydrateFromDoc = useCallback((doc: AdminLegalDocRow) => {
    setTitle(doc.draft_title || doc.title);
    setSubtitle(doc.draft_subtitle || doc.subtitle);
    setVersion(doc.draft_version || doc.version);
    setLegalReviewNotice(doc.draft_legal_review_notice || doc.legal_review_notice);
    setSections(parseSectionsSafe(doc.draft_sections_json || doc.sections_json));
    setChangeNote('');
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<AdminLegalResponse>('/api/admin/legal');
      setData(res);
      const current = res.documents.find((d) => d.key === selectedKey) || res.documents[0];
      if (current) {
        setSelectedKey(current.key);
        hydrateFromDoc(current);
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to load legal documents.');
    }
  }, [apiFetch, hydrateFromDoc, selectedKey]);

  useEffect(() => {
    load();
  }, [load]);

  const activeDoc = data?.documents.find((d) => d.key === selectedKey) || null;
  const docVersions = (data?.versions || []).filter((v) => v.document_key === selectedKey);

  const handleSelectDoc = (key: string) => {
    setSelectedKey(key);
    setMsg('');
    setErr('');
    const found = data?.documents.find((d) => d.key === key);
    if (found) hydrateFromDoc(found);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await apiFetch<{ message: string }>(`/api/admin/legal/${selectedKey}/draft`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          subtitle,
          version,
          legalReviewNotice,
          sections,
          changeNote,
        }),
      });
      await Promise.all([load(), refreshBootstrap()]);
      setMsg(res.message);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setMsg('');
    setErr('');
    try {
      const res = await apiFetch<{ message: string }>(`/api/admin/legal/${selectedKey}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          subtitle,
          version,
          legalReviewNotice,
          sections,
          changeNote: changeNote || `Published version ${version}`,
        }),
      });
      await Promise.all([load(), refreshBootstrap()]);
      setMsg(res.message);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to publish document.');
    } finally {
      setPublishing(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    setMsg('');
    setErr('');
    try {
      const res = await apiFetch<{ message: string }>(
        `/api/admin/legal/${selectedKey}/restore/${versionId}`,
        { method: 'POST' }
      );
      await Promise.all([load(), refreshBootstrap()]);
      setActiveSubTab('editor');
      setMsg(res.message);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to restore version.');
    }
  };

  const updateSection = (idx: number, patch: Partial<LegalSection>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    const nextNum = String(sections.length + 1);
    setSections((prev) => [
      ...prev,
      {
        id: `${activeDoc?.slug || 'doc'}-${Date.now()}`,
        number: nextNum,
        title: 'New Governance Section',
        paragraphs: ['Enter section policy terms here.'],
        bullets: [],
        subsections: [],
      },
    ]);
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSubsection = (secIdx: number) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec;
        const currentSubs = sec.subsections || [];
        const nextSub: LegalSubsection = {
          number: `${sec.number}.${currentSubs.length + 1}`,
          title: 'New Subsection',
          paragraphs: ['Enter subsection details here.'],
          bullets: [],
        };
        return { ...sec, subsections: [...currentSubs, nextSub] };
      })
    );
  };

  const updateSubsection = (secIdx: number, subIdx: number, patch: Partial<LegalSubsection>) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec;
        const subs = (sec.subsections || []).map((sub, j) => (j === subIdx ? { ...sub, ...patch } : sub));
        return { ...sec, subsections: subs };
      })
    );
  };

  const removeSubsection = (secIdx: number, subIdx: number) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec;
        return { ...sec, subsections: (sec.subsections || []).filter((_, j) => j !== subIdx) };
      })
    );
  };

  if (!data) {
    return <div className="p-6 text-sm text-[#5A605C]">Loading legal governance workspace...</div>;
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="p-3.5 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Document Selector Strip */}
      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#111312]">Legal Documentation & Version Control</h2>
            <p className="text-xs text-[#5A605C]">
              Edit numbered sections, save reviewed drafts, publish live versions, inspect revision history, and audit policy acceptances.
            </p>
          </div>
          {activeDoc && (
            <a
              href={`/api/public/legal/${activeDoc.slug}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#D4D8D5] text-xs font-semibold text-[#111312] hover:bg-[#F7F8F7]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Current PDF</span>
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#ECEEEC] pt-4">
          {data.documents.map((doc) => (
            <button
              key={doc.key}
              type="button"
              onClick={() => handleSelectDoc(doc.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedKey === doc.key
                  ? 'bg-[#0D0F0E] text-white'
                  : 'bg-[#F4F6F4] text-[#4A504C] hover:text-[#111312]'
              }`}
            >
              {doc.tab_label} ({doc.status})
            </button>
          ))}
        </div>

        {activeDoc && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#5A605C] tabular-nums">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Live Status:{' '}
                <strong className={activeDoc.status === 'PUBLISHED' ? 'text-[#2B7A19]' : 'text-amber-700'}>
                  {activeDoc.status}
                </strong>
              </span>
              <span>·</span>
              <span>
                Live Version: <strong className="text-[#111312] font-mono">{activeDoc.version}</strong>
              </span>
              <span>·</span>
              <span>
                Published: <strong>{activeDoc.published_at ? activeDoc.published_at.slice(0, 10) : 'Not Yet Published'}</strong>
              </span>
              <span>·</span>
              <span>
                Last Updated: <strong>{activeDoc.last_updated_at.slice(0, 10)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeSubTab === 'editor' ? 'bg-[#E9FAD6] text-[#1D5610]' : 'text-[#4A504C] hover:bg-[#F4F6F4]'
                }`}
              >
                Draft Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeSubTab === 'history' ? 'bg-[#E9FAD6] text-[#1D5610]' : 'text-[#4A504C] hover:bg-[#F4F6F4]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Versions ({docVersions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('acceptances')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeSubTab === 'acceptances' ? 'bg-[#E9FAD6] text-[#1D5610]' : 'text-[#4A504C] hover:bg-[#F4F6F4]'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Acceptances ({data.acceptances.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {activeSubTab === 'editor' && activeDoc && (
        <form onSubmit={handleSaveDraft} className="space-y-5">
          <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#111312] mb-1">Document Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111312] mb-1">Draft Version</label>
                <input
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.1-draft or 1.0"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1">Document Subtitle / Scope</label>
              <textarea
                required
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1">
                Draft / Legal Counsel Review Notice
              </label>
              <textarea
                required
                rows={2}
                value={legalReviewNotice}
                onChange={(e) => setLegalReviewNotice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-amber-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111312] mb-1">
                Revision Change Note (for Version History)
              </label>
              <input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Summarize updates made in this revision..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs"
              />
            </div>
          </div>

          {/* Numbered Sections Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111312]">
                Numbered Sections ({sections.length})
              </h3>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F6F4] hover:bg-[#E6E8E6] text-xs font-semibold text-[#111312]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            {sections.map((sec, secIdx) => (
              <div key={sec.id} className="rounded-2xl border border-[#E6E8E6] bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <input
                      value={sec.number}
                      onChange={(e) => updateSection(secIdx, { number: e.target.value })}
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-[#D4D8D5] font-mono text-xs font-bold"
                      aria-label="Section number"
                    />
                    <input
                      value={sec.title}
                      onChange={(e) => updateSection(secIdx, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#D4D8D5] text-sm font-semibold"
                      aria-label="Section title"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addSubsection(secIdx)}
                      className="px-2.5 py-1 rounded-lg border border-[#D4D8D5] text-[11px] font-semibold text-[#2B7A19] hover:bg-[#F7F8F7]"
                    >
                      + Subsection
                    </button>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(secIdx)}
                        className="p-1.5 rounded-lg border border-[#E2E5E2] text-red-700 hover:bg-red-50"
                        aria-label="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A605C] mb-1">
                      Paragraphs (one per blank line)
                    </label>
                    <textarea
                      rows={4}
                      value={(sec.paragraphs || []).join('\n\n')}
                      onChange={(e) =>
                        updateSection(secIdx, {
                          paragraphs: e.target.value
                            .split(/\n\s*\n/)
                            .map((p) => p.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-[#FAFBF9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A605C] mb-1">
                      Bullet Points (one per line, optional)
                    </label>
                    <textarea
                      rows={4}
                      value={(sec.bullets || []).join('\n')}
                      onChange={(e) =>
                        updateSection(secIdx, {
                          bullets: e.target.value
                            .split('\n')
                            .map((b) => b.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                {sec.subsections && sec.subsections.length > 0 && (
                  <div className="pl-4 border-l-2 border-[#E6E8E6] space-y-3">
                    {sec.subsections.map((sub, subIdx) => (
                      <div key={`${sec.id}-${subIdx}`} className="p-3.5 rounded-xl bg-[#FAFBF9] border border-[#ECEEEC] space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              value={sub.number}
                              onChange={(e) => updateSubsection(secIdx, subIdx, { number: e.target.value })}
                              className="w-16 px-2 py-1 rounded-lg border border-[#D4D8D5] font-mono text-xs"
                            />
                            <input
                              value={sub.title}
                              onChange={(e) => updateSubsection(secIdx, subIdx, { title: e.target.value })}
                              className="flex-1 px-2.5 py-1 rounded-lg border border-[#D4D8D5] text-xs font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSubsection(secIdx, subIdx)}
                            className="p-1 text-red-700 hover:bg-red-50 rounded"
                            aria-label="Remove subsection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                          <textarea
                            rows={2}
                            placeholder="Subsection paragraphs (separate by blank line)"
                            value={(sub.paragraphs || []).join('\n\n')}
                            onChange={(e) =>
                              updateSubsection(secIdx, subIdx, {
                                paragraphs: e.target.value
                                  .split(/\n\s*\n/)
                                  .map((p) => p.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D4D8D5] text-xs bg-white"
                          />
                          <textarea
                            rows={2}
                            placeholder="Subsection bullets (one per line)"
                            value={(sub.bullets || []).join('\n')}
                            onChange={(e) =>
                              updateSubsection(secIdx, subIdx, {
                                bullets: e.target.value
                                  .split('\n')
                                  .map((b) => b.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D4D8D5] text-xs bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#5A605C]">
              Saving creates a new revision snapshot in version history. Publishing makes this version authoritative on the public portal.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0D0F0E] bg-white text-[#0D0F0E] text-xs font-semibold hover:bg-[#F7F8F7] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>
              {canPublish && (
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold hover:bg-[#8FDD42] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Publishing...' : 'Publish Document'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {activeSubTab === 'history' && (
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111312]">
              Revision History — {activeDoc?.tab_label}
            </h3>
            <span className="text-xs text-[#5A605C] tabular-nums">{docVersions.length} snapshots</span>
          </div>
          <div className="divide-y divide-[#ECEEEC]">
            {docVersions.map((v) => (
              <div key={v.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-[#111312]">v{v.version}</span>
                    <span className={v.status === 'PUBLISHED' ? 'font-semibold text-[#2B7A19]' : 'font-semibold text-amber-700'}>
                      {v.status}
                    </span>
                    <span className="text-[#5A605C] inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3" />
                      {v.created_at}
                    </span>
                    {v.created_by_email && <span className="text-[#5A605C]">by {v.created_by_email}</span>}
                  </div>
                  <p className="text-[#373C39]">{v.change_note || 'Document revision snapshot'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreVersion(v.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D4D8D5] text-xs font-semibold text-[#111312] hover:bg-[#F7F8F7]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Load into Draft</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'acceptances' && (
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111312]">Recorded Policy Acceptances</h3>
            <p className="text-xs text-[#5A605C]">
              Audit trail of partner acknowledgments recorded during registration, partnership application submission, and legal portal acknowledgment.
            </p>
          </div>
          {data.acceptances.length === 0 ? (
            <p className="text-xs text-[#5A605C] py-6 text-center">No policy acceptances recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ECEEEC] text-[#5A605C]">
                    <th className="py-2 pr-4 font-semibold">Document</th>
                    <th className="py-2 pr-4 font-semibold">Version</th>
                    <th className="py-2 pr-4 font-semibold">User / Organization</th>
                    <th className="py-2 pr-4 font-semibold">Context</th>
                    <th className="py-2 font-semibold">Accepted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEEC] tabular-nums">
                  {data.acceptances.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 pr-4 font-semibold text-[#111312]">{a.document_title}</td>
                      <td className="py-2.5 pr-4 font-mono">{a.document_version}</td>
                      <td className="py-2.5 pr-4 text-[#373C39]">
                        {a.user_email || 'Anonymous'}
                        {a.organization_name ? ` · ${a.organization_name}` : ''}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[11px] text-[#2B7A19]">{a.context}</td>
                      <td className="py-2.5 text-[#5A605C]">{a.accepted_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
