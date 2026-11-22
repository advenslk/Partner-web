import React, { useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  Handshake,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Scale,
  Settings,
  ShieldAlert,
  Sliders,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { type SidebarNavItem, WorkspaceLayout } from '../components/Layout';
import { StatusIndicator } from '../components/UiPrimitives';
import {
  AdminBenefitsManagerView,
  AdminContentManagerView,
  AdminPartnershipTypesView,
} from './AdminCmsViews';

const ADMIN_NAV: SidebarNavItem[] = [
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/partners', label: 'Partners', icon: Building2 },
  { to: '/admin/partnerships', label: 'Partnerships', icon: Handshake },
  { to: '/admin/negotiations', label: 'Negotiations', icon: Scale },
  { to: '/admin/documents', label: 'Documents', icon: FileText },
  { to: '/admin/meetings', label: 'Meetings', icon: Calendar },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/content', label: 'Website Content', icon: Layers },
  { to: '/admin/partnership-types', label: 'Partnership Types', icon: Sliders },
  { to: '/admin/benefits', label: 'Benefits', icon: FileCheck2 },
  { to: '/admin/users', label: 'Admin Users', icon: Users },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
];

const WORKFLOW_STATUSES = [
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

export default function AdminPortalPages() {
  return (
    <WorkspaceLayout title="Admin Control Center" portalLabel="Admin" navItems={ADMIN_NAV}>
      <Routes>
        <Route index element={<AdminDashboardView />} />
        <Route path="applications" element={<ApplicationsManagementView />} />
        <Route path="partners" element={<PartnerManagementView />} />
        <Route path="partnerships" element={<PartnershipManagementView />} />
        <Route path="negotiations" element={<ApplicationsManagementView initialStatus="Negotiation" />} />
        <Route path="documents" element={<DocumentManagementView />} />
        <Route path="meetings" element={<MeetingManagementView />} />
        <Route path="messages" element={<AdminMessagesView />} />
        <Route path="analytics" element={<AnalyticsView />} />
        <Route path="content" element={<AdminContentManagerView />} />
        <Route path="partnership-types" element={<AdminPartnershipTypesView />} />
        <Route path="benefits" element={<AdminBenefitsManagerView />} />
        <Route path="users" element={<AdminUsersView />} />
        <Route path="audit-logs" element={<AuditLogsView />} />
        <Route path="settings" element={<SystemSettingsView />} />
      </Routes>
    </WorkspaceLayout>
  );
}

interface DashboardResponse {
  metrics: {
    totalApplications: number;
    pendingApplications: number;
    underReviewApplications: number;
    negotiationApplications: number;
    approvedApplications: number;
    activePartnerships: number;
    rejectedApplications: number;
    pendingMeetings: number;
    approvalRate: number;
  };
  categoryBreakdown: Array<{ category: string; slug: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
  recentAudit: Array<{
    id: string;
    actor_email: string | null;
    action: string;
    entity_type: string;
    created_at: string;
  }>;
}

function AdminDashboardView() {
  const { apiFetch } = useApp();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    apiFetch<DashboardResponse>('/api/admin/dashboard').then(setData).catch(console.error);
  }, [apiFetch]);

  if (!data) return <div className="p-6 text-sm text-[#5A605C]">Loading dashboard metrics...</div>;
  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total Applications', m.totalApplications],
          ['Pending Review', m.pendingApplications],
          ['Under Review', m.underReviewApplications],
          ['In Negotiation', m.negotiationApplications],
          ['Approved Applications', m.approvedApplications],
          ['Active Partnerships', m.activePartnerships],
          ['Rejected Applications', m.rejectedApplications],
          ['Pending Meetings', m.pendingMeetings],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-2xl border border-[#E6E8E6] bg-white p-5">
            <p className="text-xs text-[#5A605C]">{label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-[#111312] tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <h2 className="font-bold text-[#111312]">Applications by Category</h2>
          <div className="space-y-3">
            {data.categoryBreakdown.map((c) => (
              <div key={c.slug} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-[#111312]">{c.category}</span>
                  <span className="font-mono font-semibold tabular-nums">{c.count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F1F3F1] overflow-hidden">
                  <div
                    className="h-full bg-[#2B7A19]"
                    style={{
                      width: `${m.totalApplications > 0 ? Math.min(100, (c.count / m.totalApplications) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#111312]">Recent Activity</h2>
            <Activity className="w-4 h-4 text-[#2B7A19]" />
          </div>
          <div className="divide-y divide-[#ECEEEC]">
            {data.recentAudit.slice(0, 7).map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[#111312]">{a.action}</span>
                  <span className="text-[#5A605C] ml-2">{a.actor_email || 'System'}</span>
                </div>
                <span className="font-mono text-[#767D78]">{a.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationsManagementView({ initialStatus = 'ALL' }: { initialStatus?: string }) {
  const { apiFetch, bootstrap } = useApp();
  const [apps, setApps] = useState<Array<Record<string, unknown>>>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    application: Record<string, unknown>;
    history: Array<Record<string, unknown>>;
    notes: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
  } | null>(null);
  const [nextStatus, setNextStatus] = useState('Under Review');
  const [statusNote, setStatusNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [msg, setMsg] = useState('');

  const loadApps = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (search.trim()) params.set('q', search.trim());
    const res = await apiFetch<{ applications: Array<Record<string, unknown>> }>(
      `/api/admin/applications?${params.toString()}`
    );
    setApps(res.applications);
  }, [apiFetch, statusFilter, categoryFilter, search]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    const res = await apiFetch<{
      application: Record<string, unknown>;
      history: Array<Record<string, unknown>>;
      notes: Array<Record<string, unknown>>;
      documents: Array<Record<string, unknown>>;
    }>(`/api/admin/applications/${id}`);
    setDetail(res);
    setNextStatus(String(res.application.status));
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await apiFetch(`/api/admin/applications/${selectedId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, note: statusNote }),
    });
    setStatusNote('');
    setMsg(`Updated application status to ${nextStatus}.`);
    await openDetail(selectedId);
    await loadApps();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !internalNote.trim()) return;
    await apiFetch(`/api/admin/applications/${selectedId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note: internalNote }),
    });
    setInternalNote('');
    await openDetail(selectedId);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="search"
            placeholder="Search reference ID, org, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-xs min-w-[220px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            <option value="ALL">All Statuses</option>
            {WORKFLOW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            <option value="ALL">All Partnership Types</option>
            {(bootstrap?.partnershipTypes || []).map((pt) => (
              <option key={pt.slug} value={pt.slug}>
                {pt.name}
              </option>
            ))}
          </select>
        </div>
        <a
          href="/api/admin/applications-export/csv"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D8D5] text-xs font-semibold hover:bg-[#F7F8F7]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </a>
      </div>

      {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-[#E6E8E6] bg-white overflow-hidden">
          <div className="p-4 border-b border-[#ECEEEC] font-bold text-sm">
            Applications ({apps.length})
          </div>
          <div className="divide-y divide-[#ECEEEC] max-h-[600px] overflow-y-auto">
            {apps.map((a) => (
              <button
                key={String(a.id)}
                type="button"
                onClick={() => openDetail(String(a.id))}
                className={`w-full text-left p-4 hover:bg-[#FAFBF9] transition-colors ${
                  selectedId === a.id ? 'bg-[#F4F9EE]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[#2B7A19]">
                    {String(a.reference_id)}
                  </span>
                  <StatusIndicator status={String(a.status)} />
                </div>
                <p className="font-bold text-sm text-[#111312] mt-1">{String(a.organization_name)}</p>
                <p className="text-xs text-[#5A605C]">
                  {String(a.partnership_type_name)} · {String(a.contact_person)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          {!detail ? (
            <div className="rounded-2xl border border-[#E6E8E6] bg-white p-8 text-center text-sm text-[#5A605C]">
              Select an application to inspect proposal details, update workflow status, or add internal review notes.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-5">
              <div className="border-b border-[#ECEEEC] pb-4">
                <p className="font-mono text-xs text-[#2B7A19] font-semibold">
                  {String(detail.application.reference_id)}
                </p>
                <h3 className="text-xl font-bold text-[#111312]">
                  {String(detail.application.organization_name)}
                </h3>
                <p className="text-xs text-[#5A605C]">
                  {String(detail.application.contact_person)} ({String(detail.application.contact_position)}) ·{' '}
                  {String(detail.application.contact_email)}
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#373C39]">
                <p><strong>Why Partner:</strong> {String(detail.application.why_partner)}</p>
                <p><strong>What They Offer:</strong> {String(detail.application.what_can_offer)}</p>
                <p><strong>Expectations:</strong> {String(detail.application.what_expect)}</p>
                <p><strong>Objectives:</strong> {String(detail.application.objectives)}</p>
                <p><strong>Resources:</strong> {String(detail.application.resources_contributed)}</p>
              </div>

              {detail.documents.length > 0 && (
                <div className="pt-3 border-t border-[#ECEEEC] space-y-2">
                  <p className="text-xs font-bold">Attached Documents</p>
                  {detail.documents.map((d) => (
                    <a
                      key={String(d.id)}
                      href={`/api/documents/${d.id}/download`}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAFBF9] border border-[#ECEEEC] hover:border-[#0D0F0E]"
                    >
                      <span>{String(d.original_filename)} ({String(d.category)})</span>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}

              <form onSubmit={handleStatusUpdate} className="pt-4 border-t border-[#ECEEEC] space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5A605C]">
                  Update Workflow Status
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
                  >
                    {WORKFLOW_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold"
                  >
                    Save Status
                  </button>
                </div>
                <input
                  placeholder="Optional note shared in status timeline..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
                />
              </form>

              <form onSubmit={handleAddNote} className="pt-4 border-t border-[#ECEEEC] space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5A605C]">
                  Internal Reviewer Notes ({detail.notes.length})
                </p>
                <div className="flex gap-2">
                  <input
                    placeholder="Add private internal note..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full border border-[#D4D8D5] text-xs font-semibold"
                  >
                    Add Note
                  </button>
                </div>
                {detail.notes.map((n) => (
                  <div key={String(n.id)} className="p-2.5 rounded-lg bg-[#FAFBF9] text-xs">
                    <strong>{String(n.author_name || 'Staff')}:</strong> {String(n.note)}
                  </div>
                ))}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PartnerManagementView() {
  const { apiFetch, refreshBootstrap } = useApp();
  const [orgs, setOrgs] = useState<Array<Record<string, unknown>>>([]);

  const load = useCallback(async () => {
    const res = await apiFetch<{ organizations: Array<Record<string, unknown>> }>('/api/admin/partners');
    setOrgs(res.organizations);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDirectory = async (id: string, current: number) => {
    await apiFetch(`/api/admin/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicDirectoryApproved: !current }),
    });
    await refreshBootstrap();
    await load();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    await apiFetch(`/api/admin/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
    });
    await load();
  };

  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-white overflow-hidden">
      <div className="p-5 border-b border-[#ECEEEC]">
        <h2 className="font-bold text-[#111312]">Partner Organizations ({orgs.length})</h2>
      </div>
      <div className="divide-y divide-[#ECEEEC]">
        {orgs.map((o) => (
          <div key={String(o.id)} className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-[#111312]">{String(o.name)}</h3>
              <p className="text-[#5A605C]">
                {String(o.organization_type)} · {String(o.country)} · Applications: {String(o.application_count)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDirectory(String(o.id), Number(o.public_directory_approved))}
                className={`px-3 py-1.5 rounded-full font-semibold ${
                  o.public_directory_approved
                    ? 'bg-[#E9FAD6] text-[#1D5610]'
                    : 'bg-[#F4F6F4] text-[#5A605C]'
                }`}
              >
                {o.public_directory_approved ? 'Directory: Public' : 'Directory: Hidden'}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(String(o.id), String(o.status))}
                className="px-3 py-1.5 rounded-full border border-[#D4D8D5] font-semibold"
              >
                {String(o.status)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnershipManagementView() {
  const { apiFetch, bootstrap } = useApp();
  const [data, setData] = useState<{
    partnerships: Array<Record<string, unknown>>;
    agreements: Array<Record<string, unknown>>;
  }>({ partnerships: [], agreements: [] });
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    organizationId: '',
    partnershipTypeSlug: 'strategic',
    title: '',
    startDate: '',
    renewalDate: '',
  });

  const load = useCallback(async () => {
    const [pRes, oRes] = await Promise.all([
      apiFetch<{ partnerships: Array<Record<string, unknown>>; agreements: Array<Record<string, unknown>> }>(
        '/api/admin/partnerships'
      ),
      apiFetch<{ organizations: Array<{ id: string; name: string }> }>('/api/admin/partners'),
    ]);
    setData(pRes);
    setOrgs(oRes.organizations);
    if (!form.organizationId && oRes.organizations[0]) {
      setForm((prev) => ({ ...prev, organizationId: oRes.organizations[0].id }));
    }
  }, [apiFetch, form.organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/partnerships', { method: 'POST', body: JSON.stringify(form) });
    setForm((prev) => ({ ...prev, title: '' }));
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
        <h2 className="font-bold text-[#111312]">Create Active Partnership</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={form.organizationId}
            onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select
            value={form.partnershipTypeSlug}
            onChange={(e) => setForm({ ...form, partnershipTypeSlug: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
          >
            {(bootstrap?.partnershipTypes || []).map((pt) => (
              <option key={pt.slug} value={pt.slug}>
                {pt.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Partnership Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold"
          >
            Create Partnership
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-[#E6E8E6] bg-white divide-y divide-[#ECEEEC]">
        <div className="p-4 font-bold text-sm">Partnerships ({data.partnerships.length})</div>
        {data.partnerships.map((p) => (
          <div key={String(p.id)} className="p-4 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-sm text-[#111312]">{String(p.title)}</p>
              <p className="text-[#5A605C]">
                {String(p.organization_name)} · {String(p.partnership_type_name)}
              </p>
            </div>
            <StatusIndicator status={String(p.status)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentManagementView() {
  const { apiFetch } = useApp();
  const [data, setData] = useState<{
    documents: Array<Record<string, unknown>>;
    logs: Array<Record<string, unknown>>;
  }>({ documents: [], logs: [] });

  useEffect(() => {
    apiFetch<{ documents: Array<Record<string, unknown>>; logs: Array<Record<string, unknown>> }>(
      '/api/admin/documents'
    ).then(setData);
  }, [apiFetch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
        <h2 className="font-bold text-[#111312]">Private Document Vault ({data.documents.length})</h2>
        <div className="divide-y divide-[#ECEEEC]">
          {data.documents.map((d) => (
            <div key={String(d.id)} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#111312]">{String(d.original_filename)}</p>
                <p className="text-[#5A605C]">
                  {String(d.category)} · {String(d.organization_name || 'General')}
                </p>
              </div>
              <a
                href={`/api/documents/${d.id}/download`}
                className="px-3 py-1.5 rounded-full border border-[#D4D8D5] font-semibold"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
        <h2 className="font-bold text-[#111312]">Document Audit Trail</h2>
        <div className="divide-y divide-[#ECEEEC] max-h-[420px] overflow-y-auto">
          {data.logs.map((l) => (
            <div key={String(l.id)} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <strong className="text-[#2B7A19]">{String(l.action)}</strong>{' '}
                <span>{String(l.original_filename)}</span>
              </div>
              <span className="font-mono text-[#767D78]">{String(l.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingManagementView() {
  const { apiFetch } = useApp();
  const [meetings, setMeetings] = useState<Array<Record<string, unknown>>>([]);
  const [links, setLinks] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await apiFetch<{ meetings: Array<Record<string, unknown>> }>('/api/admin/meetings');
    setMeetings(res.meetings);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateMeeting = async (id: string, status: string) => {
    await apiFetch(`/api/admin/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, meetingLink: links[id] || undefined }),
    });
    await load();
  };

  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-white divide-y divide-[#ECEEEC]">
      <div className="p-5 font-bold text-[#111312]">Meeting Requests ({meetings.length})</div>
      {meetings.map((m) => (
        <div key={String(m.id)} className="p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#111312]">
                {String(m.organization_name)} — {String(m.contact_person)}
              </p>
              <p className="text-[#5A605C]">
                {String(m.email)} · {String(m.preferred_date)} at {String(m.preferred_time)} · {String(m.meeting_type)}
              </p>
              <p className="text-[#373C39] mt-1">{String(m.purpose)}</p>
            </div>
            <StatusIndicator status={String(m.status)} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="Meeting URL (e.g. https://meet...)"
              value={links[String(m.id)] ?? String(m.meeting_link || '')}
              onChange={(e) => setLinks({ ...links, [String(m.id)]: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-[#D4D8D5] flex-1 min-w-[200px]"
            />
            {(['Confirmed', 'Rescheduled', 'Rejected', 'Completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => updateMeeting(String(m.id), st)}
                className="px-3 py-1.5 rounded-full border border-[#D4D8D5] font-semibold hover:bg-[#0D0F0E] hover:text-white"
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminMessagesView() {
  const { apiFetch } = useApp();
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [orgId, setOrgId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    const [mRes, oRes] = await Promise.all([
      apiFetch<{ messages: Array<Record<string, unknown>> }>('/api/admin/messages'),
      apiFetch<{ organizations: Array<{ id: string; name: string }> }>('/api/admin/partners'),
    ]);
    setMessages(mRes.messages);
    setOrgs(oRes.organizations);
    if (!orgId && oRes.organizations[0]) setOrgId(oRes.organizations[0].id);
  }, [apiFetch, orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/messages', {
      method: 'POST',
      body: JSON.stringify({ organizationId: orgId, subject, body }),
    });
    setSubject('');
    setBody('');
    await load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
        <h2 className="font-bold text-[#111312]">Partner Communications</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {messages.map((m) => (
            <div key={String(m.id)} className="p-4 rounded-xl border border-[#ECEEEC] bg-[#FAFBF9] text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span>
                  {String(m.organization_name)} · {String(m.sender_name)}
                </span>
                <span className="font-mono text-[#767D78]">{String(m.created_at)}</span>
              </div>
              <p className="font-bold text-[#2B7A19]">{String(m.subject)}</p>
              <p className="text-[#373C39] mt-1">{String(m.body)}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleReply} className="lg:col-span-5 rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4 h-fit">
        <h2 className="font-bold text-[#111312]">Send Representative Message</h2>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
        />
        <textarea
          required
          rows={5}
          placeholder="Message body..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
        />
        <button type="submit" className="px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold">
          Send Message
        </button>
      </form>
    </div>
  );
}

function AnalyticsView() {
  const { apiFetch } = useApp();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    apiFetch<DashboardResponse>('/api/admin/dashboard').then(setData);
  }, [apiFetch]);

  if (!data) return <div className="p-6 text-sm text-[#5A605C]">Computing database analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
          <p className="text-xs text-[#5A605C]">Total Applications (Database)</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{data.metrics.totalApplications}</p>
        </div>
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
          <p className="text-xs text-[#5A605C]">Approval Conversion Rate</p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#2B7A19] tabular-nums">
            {data.metrics.approvalRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6">
          <p className="text-xs text-[#5A605C]">Active Partnerships</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums">{data.metrics.activePartnerships}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
          <h2 className="font-bold text-[#111312]">Monthly Application Volume</h2>
          {data.monthlyTrends.map((m) => (
            <div key={m.month} className="flex items-center justify-between text-xs py-1.5 border-b border-[#ECEEEC]">
              <span className="font-mono">{m.month}</span>
              <span className="font-mono font-bold tabular-nums">{m.count}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-3">
          <h2 className="font-bold text-[#111312]">Application Sources</h2>
          {data.sourceBreakdown.map((s) => (
            <div key={s.source} className="flex items-center justify-between text-xs py-1.5 border-b border-[#ECEEEC]">
              <span>{s.source}</span>
              <span className="font-mono font-bold tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminUsersView() {
  const { apiFetch, user } = useApp();
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'REVIEWER',
  });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ users: Array<Record<string, unknown>> }>('/api/admin/users');
      setUsers(res.users);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to load users.');
    }
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
      setForm({ fullName: '', email: '', password: '', role: 'REVIEWER' });
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to create user.');
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    await apiFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}

      {user?.role === 'SUPER_ADMIN' && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <h2 className="font-bold text-[#111312]">Create Staff / Admin Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              required
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Password (8+ chars)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 rounded-xl border border-[#D4D8D5] text-xs bg-white"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="PARTNERSHIP_MANAGER">PARTNERSHIP_MANAGER</option>
              <option value="REVIEWER">REVIEWER</option>
              <option value="PARTNER">PARTNER</option>
            </select>
          </div>
          <button type="submit" className="px-5 py-2 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold">
            Provision User
          </button>
        </form>
      )}

      <div className="rounded-2xl border border-[#E6E8E6] bg-white divide-y divide-[#ECEEEC]">
        {users.map((u) => (
          <div key={String(u.id)} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <p className="font-bold text-sm text-[#111312]">{String(u.full_name)}</p>
              <p className="text-[#5A605C]">
                {String(u.email)} · <strong className="text-[#2B7A19]">{String(u.role)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleStatus(String(u.id), String(u.status))}
              className="px-3 py-1.5 rounded-full border border-[#D4D8D5] font-semibold"
            >
              {String(u.status)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogsView() {
  const { apiFetch } = useApp();
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    apiFetch<{ logs: Array<Record<string, unknown>> }>('/api/admin/audit-logs').then((r) => setLogs(r.logs));
  }, [apiFetch]);

  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-white overflow-hidden">
      <div className="p-5 border-b border-[#ECEEEC] font-bold text-[#111312]">
        Security & Activity Audit Logs ({logs.length})
      </div>
      <div className="divide-y divide-[#ECEEEC] max-h-[600px] overflow-y-auto">
        {logs.map((l) => (
          <div key={String(l.id)} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-mono font-bold text-[#2B7A19] mr-2">{String(l.action)}</span>
              <span className="text-[#111312]">{String(l.actor_email || 'Anonymous')}</span>
              <span className="text-[#5A605C] ml-2">
                {String(l.entity_type)} {l.entity_id ? `(${String(l.entity_id).slice(0, 8)})` : ''}
              </span>
            </div>
            <span className="font-mono text-[#767D78]">{String(l.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemSettingsView() {
  const { apiFetch, refreshBootstrap } = useApp();
  const [settings, setSettings] = useState<Array<{ key: string; value: string; description: string }>>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch<{ settings: Array<{ key: string; value: string; description: string }> }>('/api/admin/settings').then(
      (r) => setSettings(r.settings)
    );
  }, [apiFetch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: settings.map((s) => ({ key: s.key, value: s.value })) }),
    });
    await refreshBootstrap();
    setMsg('System settings saved.');
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-5 max-w-2xl">
      <h2 className="text-lg font-bold text-[#111312]">System Configuration Settings</h2>
      {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium">{msg}</div>}
      <div className="space-y-4">
        {settings.map((s, idx) => (
          <div key={s.key} className="space-y-1">
            <label className="block text-xs font-bold text-[#111312] font-mono">{s.key}</label>
            <p className="text-[11px] text-[#5A605C]">{s.description}</p>
            <input
              value={s.value}
              onChange={(e) => {
                const next = [...settings];
                next[idx] = { ...s, value: e.target.value };
                setSettings(next);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4D8D5] text-sm"
            />
          </div>
        ))}
      </div>
      <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold">
        Save Settings
      </button>
    </form>
  );
}
