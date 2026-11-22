import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { apiFetch, refreshSession } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch<{ user: { role: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await refreshSession();
      if (['SUPER_ADMIN', 'ADMIN', 'PARTNERSHIP_MANAGER', 'REVIEWER'].includes(res.user.role)) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 lg:py-24 bg-[#F7F8F7] min-h-[75vh] flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="rounded-3xl border border-[#E6E8E6] bg-white p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2B7A19]">
              HelzerX Portal Access
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-[#111312]">Partner & Staff Sign In</h1>
            <p className="mt-1 text-xs text-[#5A605C]">
              Access your partnership application timeline, messages, and agreements.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#2B7A19] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold hover:bg-[#222624] disabled:opacity-50"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#ECEEEC] text-xs text-[#5A605C] flex items-center justify-between">
            <span>New partner organization?</span>
            <Link to="/register" className="font-semibold text-[#111312] hover:text-[#2B7A19]">
              Create Partner Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { apiFetch, refreshSession } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    organizationType: 'Technology Company',
    country: '',
  });
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyHint, setVerifyHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedPolicies) {
      setErrorMsg('Please confirm that you have reviewed the Privacy Policy and Terms of Service.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch<{ verificationPreviewHint?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await refreshSession();
      if (res.verificationPreviewHint) {
        setVerifyHint(res.verificationPreviewHint);
      } else {
        navigate('/portal');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 lg:py-20 bg-[#F7F8F7] min-h-[75vh] flex items-center">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="rounded-3xl border border-[#E6E8E6] bg-white p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2B7A19]">
              Partner Registration
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-[#111312]">Create Partner Account</h1>
            <p className="mt-1 text-xs text-[#5A605C]">
              Register to manage your organization profile, track proposals, and communicate with HelzerX.
            </p>
          </div>

          {verifyHint ? (
            <div className="p-5 rounded-2xl bg-[#E9FAD6] border border-[#C8DFB4] space-y-3 text-sm text-[#1D5610]">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Account Created — Verification Token Issued</span>
              </div>
              <p className="text-xs">
                SMTP is currently using the internal outbox. Use this verification token on the verification screen:
              </p>
              <p className="font-mono text-xs bg-white px-3 py-2 rounded-lg border border-[#C8DFB4] break-all">
                {verifyHint}
              </p>
              <div className="flex gap-3 pt-1">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(form.email)}&token=${encodeURIComponent(verifyHint)}`}
                  className="px-4 py-2 rounded-full bg-[#0D0F0E] text-white text-xs font-semibold"
                >
                  Verify Email Now
                </Link>
                <Link to="/portal" className="px-4 py-2 rounded-full border border-[#1D5610] text-xs font-semibold">
                  Open Portal
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Business Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Password (minimum 8 characters) *</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Organization Name</label>
                  <input
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Country</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#4A504C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(e) => setAcceptedPolicies(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I acknowledge the{' '}
                  <Link to="/legal/privacy" target="_blank" className="underline font-semibold text-[#111312]">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/legal/terms" target="_blank" className="underline font-semibold text-[#111312]">
                    Terms of Service
                  </Link>{' '}
                  governing HelzerX Partner Portal accounts.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#9EE855] text-[#0D0F0E] text-sm font-semibold hover:bg-[#8FDD42] disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Partner Account'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#ECEEEC] text-xs text-[#5A605C] flex items-center justify-between">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-[#111312] hover:text-[#2B7A19]">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { apiFetch } = useApp();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState<'request' | 'reset' | 'done'>('request');
  const [hint, setHint] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await apiFetch<{ message: string; resetPreviewHint?: string }>(
        '/api/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) }
      );
      setMsg(res.message);
      if (res.resetPreviewHint) setHint(res.resetPreviewHint);
      setStage('reset');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Request failed.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await apiFetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, newPassword }),
      });
      setMsg(res.message);
      setStage('done');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Reset failed.');
    }
  };

  return (
    <div className="py-16 lg:py-24 bg-[#F7F8F7] min-h-[75vh] flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="rounded-3xl border border-[#E6E8E6] bg-white p-8 space-y-5">
          <div className="w-10 h-10 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#111312]">Password Recovery</h1>

          {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}
          {msg && <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs">{msg}</div>}
          {hint && (
            <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E5E2] text-xs">
              <span className="block font-semibold mb-1">Outbox Reset Token:</span>
              <code className="font-mono break-all">{hint}</code>
            </div>
          )}

          {stage === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Account Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold"
              >
                Send Reset Instructions
              </button>
            </form>
          )}

          {stage === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Reset Token</label>
                <input
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">New Password (8+ chars)</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#9EE855] text-[#0D0F0E] text-sm font-semibold"
              >
                Reset Password
              </button>
            </form>
          )}

          {stage === 'done' && (
            <Link
              to="/login"
              className="block w-full text-center py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold"
            >
              Return to Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const { apiFetch, refreshSession } = useApp();
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState(params.get('email') || '');
  const [token, setToken] = useState(params.get('token') || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const res = await apiFetch<{ message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      });
      await refreshSession();
      setMsg(res.message);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Verification failed.');
    }
  };

  return (
    <div className="py-16 lg:py-24 bg-[#F7F8F7] min-h-[75vh] flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="rounded-3xl border border-[#E6E8E6] bg-white p-8 space-y-5">
          <div className="w-10 h-10 rounded-xl bg-[#E9FAD6] text-[#2B7A19] flex items-center justify-center">
            <MailCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#111312]">Verify Email Address</h1>

          {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{err}</div>}
          {msg && (
            <div className="p-3 rounded-xl bg-[#E9FAD6] text-[#1D5610] text-xs font-medium">
              {msg}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Verification Token</label>
              <input
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D8D5] text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0D0F0E] text-white text-sm font-semibold"
            >
              Confirm Verification
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
