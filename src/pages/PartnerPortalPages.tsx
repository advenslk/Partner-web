import React, { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  LayoutDashboard,
  MessageSquare,
  Send,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { type SidebarNavItem, WorkspaceLayout } from '../components/Layout';
import { EmptyState, StatusIndicator } from '../components/UiPrimitives';

interface PortalOverviewData {
  organizations: Array<{
    id: string;
    name: string;
    organization_type: string;
    country: string;
    website: string | null;
    description: string;
    year_established: number | null;
    collaboration_summary: string | null;
    public_directory_approved: number;
  }>;
  applications: Array<{
    id: string;
    reference_id: string;
    organization_id: string;
    organization_name: string;
    partnership_type_slug: string;
    partnership_type_name: string;
    status: string;
    expected_duration: string;
    why_partner: string;
    objectives: string;
    manager_name: string | null;
    manager_email: string | null;
    created_at: string;
    updated_at: string;
  }>;
  statusHistory: Array<{
    id: string;
    reference_id: string;
    from_status: string | null;
    to_status: string;
    actor_name: string | null;
    note: string | null;
    created_at: string;
  }>;
  partnerships: Array<{
    id: string;
    title: string;
    partnership_type_name: string;
    status: string;
    progress_percent: number;
    start_date: string | null;
    renewal_date: string | null;
    manager_name: string | null;
  }>;
  agreements: Array<{
    id: string;
    title: string;
    agreement_type: string;
    status: string;
    effective_date: string | null;
    expiry_date: string | null;
    document_id: string | null;
  }>;
  documents: Array<{
    id: string;
    category: string;
    original_filename: string;
    size_bytes: number;
    created_at: string;
  }>;
  messages: Array<{
    id: string;
    organization_id: string;
    sender_name: string;
    sender_role: string;
    subject: string;
    body: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    category: string;
    is_read: number;
    created_at: string;
  }>;
  meetings: Array<{
    id: string;
    preferred_date: string;
    preferred_time: string;
    meeting_type: string;
    status: string;
    meeting_link: string | null;
    purpose: string;
  }>;
}

const NAV_ITEMS: SidebarNavItem[] = [
  { to: '/portal', label: 'Partner Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/status', label: 'Application Status', icon: ClipboardList },
  { to: '/portal/profile', label: 'Partnership Profile', icon: Building2 },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { to: '/portal/documents', label: 'Documents', icon: FileText },
  { to: '/portal/agreements', label: 'Agreements', icon: FileCheck2 },
  { to: '/portal/notifications', label: 'Notifications', icon: Bell },
  { to: '/portal/settings', label: 'Account Settings', icon: Settings },
];

export default function PartnerPortalPages() {
  const { user, apiFetch, refreshSession } = useApp();
  const [data, setData] = useState<PortalOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await apiFetch<PortalOverviewData>('/api/portal/overview');
      setData(res);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load portal workspace.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <WorkspaceLayout title="Partner Portal" portalLabel="Partner" navItems={NAV_ITEMS}>
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-white border border-[#E6E8E6] animate-pulse" />
          <div className="h-64 rounded-2xl bg-white border border-[#E6E8E6] animate-pulse" />
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMsg}
        </div>
      ) : (
        <Routes>
          <Route index element={<DashboardHome data={data!} userEmail={user?.email || ''} userName={user?.fullName || ''} emailVerified={Boolean(user?.emailVerified)} />} />
          <Route path="status" element={<ApplicationStatusView data={data!} />} />
          <Route path="profile" element={<ProfileView data={data!} onSaved={loadData} />} />
          <Route path="messages" element={<MessagesView data={data!} onSent={loadData} />} />
          <Route path="documents" element={<DocumentsView data={data!} onUploaded={loadData} />} />
          <Route path="agreements" element={<AgreementsView data={data!} />} />
          <Route path="notifications" element={<NotificationsView data={data!} onUpdated={loadData} />} />
          <Route path="settings" element={<AccountSettingsView onSaved={refreshSession} />} />
        </Routes>
      )}
    </WorkspaceLayout>
  );
}

function DashboardHome({
  data,
  userName,
  userEmail,
  emailVerified,
}: {
  data: PortalOverviewData;
  userName: string;
  userEmail: string;
  emailVerified: boolean;
}) {
  const { apiFetch } = useApp();
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const latestApp = data.applications[0];
  const org = data.organizations[0];
  const unreadNotifs = data.notifications.filter((n) => !n.is_read).length;

  const resendVerify = async () => {
    try {
      const res = await apiFetch<{ message: string; verificationPreviewHint?: string }>(
        '/api/auth/resend-verification',
        { method: 'POST' }
      );
      setVerifyFeedback(
        res.verificationPreviewHint
          ? `${res.message} Token: ${res.verificationPreviewHint}`
          : res.message
      );
    } catch (err) {
      setVerifyFeedback(err instanceof Error ? err.message : 'Unable to send verification.');
    }
  };

  return (
    <div className="space-y-6">
      {!emailVerified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
          <div>
            <strong>Email verification pending:</strong> Verify {userEmail} to receive uninterrupted status notifications.
            {verifyFeedback && <p className="mt-1 font-mono">{verifyFeedback}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resendVerify}
              className="px-3.5 py-1.5 rounded-full bg-[#0D0F0E] text-white font-semibold"
            >
              Send Verification Token
            </button>
            <Link to="/verify-email" className="underline font-semibold">
              Enter Token
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2B7A19]">
            Welcome Back
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#111312]">{userName}</h2>
          <p className="mt-1 text-sm text-[#5A605C]">
            {org ? `${org.name} · ${org.organization_type}` : 'No organization profile linked yet.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/request-meeting"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D4D8D5] text-xs font-semibold hover:bg-[#F7F8F7]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Request Meeting</span>
          </Link>
          <Link
            to="/apply"
            className="px-4 py-2 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold hover:bg-[#8FDD42]"
          >
            Submit New Proposal
          </Link>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5">
          <p className="text-xs text-[#5A605C]">Latest Reference ID</p>
          <p className="mt-2 font-mono text-base font-bold text-[#111312] tabular-nums">
            {latestApp ? latestApp.reference_id : 'None submitted'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5">
          <p className="text-xs text-[#5A605C]">Current Application Status</p>
          <div className="mt-2">
            {latestApp ? <StatusIndicator status={latestApp.status} /> : <span className="text-sm text-[#767D78]">—</span>}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5">
          <p className="text-xs text-[#5A605C]">Assigned Partnership Manager</p>
          <p className="mt-2 text-sm font-semibold text-[#111312]">
            {latestApp?.manager_name || 'Pending Assignment'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-5">
          <p className="text-xs text-[#5A605C]">Unread Notifications</p>
          <p className="mt-2 font-mono text-xl font-bold text-[#111312] tabular-nums">{unreadNotifs}</p>
        </div>
      </div>

      {/* Recent Meetings & Active Partnerships */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#111312]">Active Partnerships</h3>
            <Link to="/portal/agreements" className="text-xs font-semibold text-[#2B7A19] hover:underline">
              View Agreements
            </Link>
          </div>
          {data.partnerships.length === 0 ? (
            <p className="text-sm text-[#5A605C]">
              Active partnership records appear here once an application is approved and initiated.
            </p>
          ) : (
            <div className="space-y-3">
              {data.partnerships.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-[#ECEEEC] bg-[#FAFBF9]">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-[#111312]">{p.title}</p>
                    <StatusIndicator status={p.status} />
                  </div>
                  <p className="text-xs text-[#5A605C] mt-1">
                    {p.partnership_type_name} · Renewal: {p.renewal_date || 'Not scheduled'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#111312]">Meeting Requests</h3>
            <Link to="/request-meeting" className="text-xs font-semibold text-[#2B7A19] hover:underline">
              Schedule New
            </Link>
          </div>
          {data.meetings.length === 0 ? (
            <p className="text-sm text-[#5A605C]">No scheduled or requested meetings yet.</p>
          ) : (
            <div className="space-y-3">
              {data.meetings.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-[#ECEEEC] bg-[#FAFBF9] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#111312]">{m.meeting_type}</span>
                    <StatusIndicator status={m.status} />
                  </div>
                  <p className="text-[#5A605C]">
                    {m.preferred_date} · {m.preferred_time}
                  </p>
                  {m.meeting_link && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-semibold text-[#2B7A19] underline pt-1"
                    >
                      Join Meeting Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusView({ data }: { data: PortalOverviewData }) {
  if (data.applications.length === 0) {
    return (
      <EmptyState
        title="No partnership applications found"
        description="Submit your first partnership proposal to track its review timeline here."
        action={
          <Link to="/apply" className="px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold">
            Submit Application
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {data.applications.map((app) => (
          <div key={app.id} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECEEEC] pb-4">
              <div>
                <p className="font-mono text-xs font-semibold text-[#2B7A19]">{app.reference_id}</p>
                <h2 className="text-lg font-bold text-[#111312]">
                  {app.organization_name} — {app.partnership_type_name}
                </h2>
              </div>
              <StatusIndicator status={app.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#4A504C]">
              <div>
                <span className="text-[#767D78] block">Expected Duration</span>
                <strong className="text-[#111312]">{app.expected_duration}</strong>
              </div>
              <div>
                <span className="text-[#767D78] block">Assigned Manager</span>
                <strong className="text-[#111312]">{app.manager_name || 'Pending Assignment'}</strong>
              </div>
              <div>
                <span className="text-[#767D78] block">Submitted On</span>
                <strong className="font-mono text-[#111312]">{app.created_at.slice(0, 10)}</strong>
              </div>
            </div>

            <div className="text-xs text-[#5A605C] space-y-1">
              <p><strong className="text-[#111312]">Proposal Objectives:</strong> {app.objectives}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
        <h3 className="font-bold text-[#111312]">Application Status Timeline</h3>
        <div className="divide-y divide-[#ECEEEC]">
          {data.statusHistory.map((h) => (
            <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-mono font-semibold text-[#2B7A19] mr-2">{h.reference_id}</span>
                <span className="font-semibold text-[#111312]">
                  {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                </span>
                {h.note && <p className="text-[#5A605C] mt-0.5">{h.note}</p>}
              </div>
              <span className="font-mono text-[#767D78] whitespace-nowrap">{h.created_at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileView({ data, onSaved }: { data: PortalOverviewData; onSaved: () => Promise<void> }) {
  const { apiFetch } = useApp();
  const org = data.organizations[0];
  const [form, setForm] = useState({
    organizationId: org?.id || '',
    name: org?.name || '',
    organizationType: org?.organization_type || 'Technology Company',
    country: org?.country || '',
    website: org?.website || '',
    description: org?.description || '',
    yearEstablished: org?.year_established ? String(org.year_established) : '',
    collaborationSummary: org?.collaboration_summary || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!org) {
    return (
      <EmptyState
        title="No organization profile linked"
        description="Submit a partnership application to initialize your organization profile."
        action={
          <Link to="/apply" className="px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold">
            Create Proposal
          </Link>
        }
      />
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await apiFetch('/api/portal/organization', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          yearEstablished: form.yearEstablished ? Number(form.yearEstablished) : null,
        }),
      });
      await onSaved();
      setMsg('Organization profile updated.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 sm:p-8 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[#111312]">Organization Profile</h2>
        <p className="text-xs text-[#5A605C] mt-1">
          Public Partner Directory Visibility:{' '}
          <strong className="text-[#111312]">
            {org.public_directory_approved ? 'Approved for Public Listing' : 'Private (Admin approval required)'}
          </strong>
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}
      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5">Organization Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Organization Type</label>
          <input
            required
            value={form.organizationType}
            onChange={(e) => setForm({ ...form, organizationType: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Country</label>
          <input
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Official Website</label>
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">Organization Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624]"
      >
        {saving ? 'Saving...' : 'Save Organization Profile'}
      </button>
    </form>
  );
}

function MessagesView({ data, onSent }: { data: PortalOverviewData; onSent: () => Promise<void> }) {
  const { apiFetch } = useApp();
  const org = data.organizations[0];
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  if (!org) {
    return (
      <EmptyState
        title="Messaging requires an organization profile"
        description="Submit a partnership application or register an organization to message HelzerX representatives."
      />
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErr('');
    try {
      await apiFetch('/api/portal/messages', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: org.id,
          applicationId: data.applications[0]?.id || null,
          subject,
          body,
        }),
      });
      setSubject('');
      setBody('');
      await onSent();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4">
        <h2 className="font-bold text-[#111312]">Conversation History</h2>
        {data.messages.length === 0 ? (
          <p className="text-sm text-[#5A605C]">No messages exchanged yet.</p>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {data.messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border text-sm ${
                  m.sender_role === 'PARTNER'
                    ? 'border-[#E6E8E6] bg-[#FAFBF9]'
                    : 'border-[#C8DFB4] bg-[#F2FBE8]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#111312]">
                    {m.sender_name} ({m.sender_role})
                  </span>
                  <span className="font-mono text-[#767D78]">{m.created_at}</span>
                </div>
                <p className="text-xs font-semibold text-[#2B7A19] mb-1">{m.subject}</p>
                <p className="text-xs text-[#373C39] whitespace-pre-line">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="lg:col-span-5 rounded-2xl border border-[#E6E8E6] bg-white p-6 space-y-4 h-fit"
      >
        <h2 className="font-bold text-[#111312]">Message HelzerX Representative</h2>
        {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}
        <div>
          <label className="block text-xs font-semibold mb-1.5">Subject</label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">Message</label>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold hover:bg-[#222624]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>
    </div>
  );
}

function DocumentsView({ data, onUploaded }: { data: PortalOverviewData; onUploaded: () => Promise<void> }) {
  const { apiFetch } = useApp();
  const org = data.organizations[0];
  const [category, setCategory] = useState('Supporting Documents');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !org) return;
    setUploading(true);
    setErr('');
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('organizationId', org.id);
      if (data.applications[0]?.id) fd.append('applicationId', data.applications[0].id);
      await apiFetch('/api/portal/documents', { method: 'POST', body: fd });
      setFile(null);
      setMsg('Document uploaded to private vault.');
      await onUploaded();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {org && (
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-[#E6E8E6] bg-white p-6 flex flex-col md:flex-row items-stretch md:items-end gap-4"
        >
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1.5">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm bg-white"
            >
              <option>Company Profiles</option>
              <option>Business Proposals</option>
              <option>Partnership Agreements</option>
              <option>NDAs</option>
              <option>Supporting Documents</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1.5">Select File (PDF, DOCX, PNG, JPG, ZIP)</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs w-full"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#9EE855] text-[#0D0F0E] text-xs font-semibold hover:bg-[#8FDD42] disabled:opacity-50"
          >
            <FileUp className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          </button>
        </form>
      )}

      {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs">{msg}</div>}
      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}

      <div className="rounded-2xl border border-[#E6E8E6] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#ECEEEC]">
          <h2 className="font-bold text-[#111312]">Private Organization Documents</h2>
        </div>
        {data.documents.length === 0 ? (
          <div className="p-6 text-sm text-[#5A605C]">No documents uploaded yet.</div>
        ) : (
          <div className="divide-y divide-[#ECEEEC]">
            {data.documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-sm text-[#111312]">{doc.original_filename}</p>
                  <p className="text-[#5A605C]">
                    {doc.category} · {(doc.size_bytes / 1024).toFixed(1)} KB · {doc.created_at}
                  </p>
                </div>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D4D8D5] font-semibold hover:bg-[#F7F8F7]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgreementsView({ data }: { data: PortalOverviewData }) {
  if (data.agreements.length === 0) {
    return (
      <EmptyState
        title="No partnership agreements issued yet"
        description="Draft and executed agreements (including NDAs and commercial schedules) appear here when prepared by your Partnership Manager."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-white divide-y divide-[#ECEEEC]">
      {data.agreements.map((ag) => (
        <div key={ag.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#2B7A19]">{ag.agreement_type}</p>
            <h3 className="text-base font-bold text-[#111312]">{ag.title}</h3>
            <p className="text-xs text-[#5A605C] mt-1 font-mono">
              Effective: {ag.effective_date || 'Pending'} · Expiry: {ag.expiry_date || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusIndicator status={ag.status} />
            {ag.document_id && (
              <a
                href={`/api/documents/${ag.document_id}/download`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D4D8D5] text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsView({ data, onUpdated }: { data: PortalOverviewData; onUpdated: () => Promise<void> }) {
  const { apiFetch } = useApp();

  const markRead = async (id: string) => {
    await apiFetch(`/api/portal/notifications/${id}/read`, { method: 'PATCH' });
    await onUpdated();
  };

  const markAll = async () => {
    await apiFetch('/api/portal/notifications/read-all', { method: 'PATCH' });
    await onUpdated();
  };

  return (
    <div className="rounded-2xl border border-[#E6E8E6] bg-white overflow-hidden">
      <div className="p-5 border-b border-[#ECEEEC] flex items-center justify-between">
        <h2 className="font-bold text-[#111312]">Notifications</h2>
        {data.notifications.some((n) => !n.is_read) && (
          <button
            type="button"
            onClick={markAll}
            className="text-xs font-semibold text-[#2B7A19] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      {data.notifications.length === 0 ? (
        <div className="p-6 text-sm text-[#5A605C]">You have no notifications.</div>
      ) : (
        <div className="divide-y divide-[#ECEEEC]">
          {data.notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 ${n.is_read ? 'bg-white' : 'bg-[#F7FCEF]'}`}
            >
              <div>
                <p className="text-xs font-semibold text-[#2B7A19]">{n.category}</p>
                <h3 className="text-sm font-bold text-[#111312] mt-0.5">{n.title}</h3>
                <p className="text-xs text-[#5A605C] mt-1">{n.body}</p>
                <p className="text-[11px] font-mono text-[#767D78] mt-1">{n.created_at}</p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="px-3 py-1 rounded-full border border-[#D4D8D5] text-xs font-semibold whitespace-nowrap"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountSettingsView({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user, apiFetch } = useApp();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    notificationEmail: user?.notifications.email ?? true,
    notificationStatusUpdates: user?.notifications.statusUpdates ?? true,
    notificationMessages: user?.notifications.messages ?? true,
    currentPassword: '',
    newPassword: '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      await apiFetch('/api/auth/account-settings', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName,
          notificationEmail: form.notificationEmail,
          notificationStatusUpdates: form.notificationStatusUpdates,
          notificationMessages: form.notificationMessages,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      await onSaved();
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setMsg('Account settings updated.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save settings.');
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E6E8E6] bg-white p-6 sm:p-8 space-y-5 max-w-2xl">
      <h2 className="text-xl font-bold text-[#111312]">Account & Notification Settings</h2>
      {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium">{msg}</div>}
      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}

      <div>
        <label className="block text-xs font-semibold mb-1.5">Full Name</label>
        <input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
        />
      </div>

      <div className="space-y-2.5 pt-2 border-t border-[#ECEEEC]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5A605C]">Email Notification Preferences</p>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.notificationEmail}
            onChange={(e) => setForm({ ...form, notificationEmail: e.target.checked })}
          />
          <span>Enable portal email notifications</span>
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.notificationStatusUpdates}
            onChange={(e) => setForm({ ...form, notificationStatusUpdates: e.target.checked })}
          />
          <span>Notify when application status changes</span>
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.notificationMessages}
            onChange={(e) => setForm({ ...form, notificationMessages: e.target.checked })}
          />
          <span>Notify on new messages from HelzerX</span>
        </label>
      </div>

      <div className="space-y-3 pt-3 border-t border-[#ECEEEC]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5A605C]">Change Password (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="password"
            placeholder="Current Password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...prevFrom(form), currentPassword: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
          <input
            type="password"
            placeholder="New Password (8+ chars)"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624]"
      >
        Save Preferences
      </button>
    </form>
  );
}

function prevFrom<T>(v: T): T {
  return v;
}
