import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PublicLayout() {
  const { user, isStaff, bootstrap } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/divisions', label: 'Divisions' },
    { to: '/opportunities', label: 'Opportunities' },
    { to: '/compare', label: 'Compare' },
    { to: '/directory', label: 'Directory' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111312]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#ECEEEC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-[#111312] whitespace-nowrap shrink-0"
          >
            HelzerX
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A605C]">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[#111312] ${
                    isActive ? 'text-[#111312] font-semibold' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <Link
                to={isStaff ? '/admin' : '/portal'}
                className="px-4 py-2 text-sm font-medium text-[#111312] border border-[#E2E5E2] rounded-full hover:bg-[#F7F8F7] transition-colors whitespace-nowrap shrink-0"
              >
                {isStaff ? 'Admin Console' : 'Partner Portal'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#111312] border border-[#E2E5E2] rounded-full hover:bg-[#F7F8F7] transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            )}
            <Link
              to="/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0D0F0E] rounded-full hover:bg-[#222624] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Become a Partner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg border border-[#E6E8E6] text-[#111312]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#ECEEEC] bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ...navLinks,
                { to: '/capabilities', label: 'Capabilities' },
                { to: '/why-partner', label: 'Why Partner' },
                { to: '/what-we-offer', label: 'What We Offer' },
                { to: '/what-we-expect', label: 'What We Expect' },
                { to: '/process', label: 'Process' },
                { to: '/case-studies', label: 'Case Studies' },
                { to: '/faq', label: 'FAQ' },
                { to: '/request-meeting', label: 'Request Meeting' },
                { to: '/contact', label: 'Contact' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-[#111312] rounded-lg hover:bg-[#F7F8F7]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-[#ECEEEC] flex flex-col gap-2">
              <Link
                to={user ? (isStaff ? '/admin' : '/portal') : '/login'}
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 text-center text-sm font-medium border border-[#E2E5E2] rounded-full"
              >
                {user ? (isStaff ? 'Admin Console' : 'Partner Portal') : 'Partner Sign In'}
              </Link>
              <Link
                to="/apply"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold bg-[#9EE855] text-[#0D0F0E] rounded-full"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#0D0F0E] text-white border-t border-[#1D211F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <Link to="/" className="text-xl font-bold tracking-tight text-white">
                HelzerX Technologies
              </Link>
              <p className="mt-3 text-sm text-[#A7ADA9] max-w-sm leading-relaxed">
                Build Together. Grow Together. Connecting businesses, creating opportunities, and building reliable technology ecosystems.
              </p>
              <p className="mt-4 text-xs text-[#767D78]">
                {bootstrap?.content?.contact?.email || 'partnerships@helzerx.example'} · Response Window:{' '}
                {bootstrap?.content?.contact?.responseWindow || '1–3 Business Days'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9EE855] mb-4">
                Company
              </h3>
              <ul className="space-y-2.5 text-sm text-[#C4C9C6]">
                <li><Link to="/about" className="hover:text-white transition-colors">About HelzerX</Link></li>
                <li><Link to="/divisions" className="hover:text-white transition-colors">Our Divisions</Link></li>
                <li><Link to="/capabilities" className="hover:text-white transition-colors">Our Capabilities</Link></li>
                <li><Link to="/why-partner" className="hover:text-white transition-colors">Why Partner With Us</Link></li>
                <li><Link to="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
                <li><Link to="/directory" className="hover:text-white transition-colors">Partner Directory</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9EE855] mb-4">
                Partnerships
              </h3>
              <ul className="space-y-2.5 text-sm text-[#C4C9C6]">
                <li><Link to="/opportunities" className="hover:text-white transition-colors">Opportunities</Link></li>
                <li><Link to="/partnerships" className="hover:text-white transition-colors">Partnership Types</Link></li>
                <li><Link to="/compare" className="hover:text-white transition-colors">Comparison Matrix</Link></li>
                <li><Link to="/what-we-offer" className="hover:text-white transition-colors">What We Offer</Link></li>
                <li><Link to="/what-we-expect" className="hover:text-white transition-colors">What We Expect</Link></li>
                <li><Link to="/process" className="hover:text-white transition-colors">Partnership Process</Link></li>
                <li><Link to="/apply" className="hover:text-white transition-colors">Apply Now</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9EE855] mb-4">
                Portal & Legal
              </h3>
              <ul className="space-y-2.5 text-sm text-[#C4C9C6]">
                <li><Link to="/login" className="hover:text-white transition-colors">Partner Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Partner Registration</Link></li>
                <li><Link to="/request-meeting" className="hover:text-white transition-colors">Request a Meeting</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#1F2421] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#8D938F]">
            <p>© {new Date().getFullYear()} HelzerX Technologies. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/legal/partnership-terms" className="hover:text-white">Partnership Terms</Link>
              <Link to="/legal/aup" className="hover:text-white">Acceptable Use</Link>
              <Link to="/legal/data-handling" className="hover:text-white">Data Handling</Link>
              <Link to="/legal/cookies" className="hover:text-white">Cookie Policy</Link>
              <Link to="/legal/nda" className="hover:text-white">NDA Info</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

export function WorkspaceLayout({
  title,
  portalLabel,
  navItems,
  children,
}: {
  title: string;
  portalLabel: string;
  navItems: SidebarNavItem[];
  children: React.ReactNode;
}) {
  const { user, logout, isStaff } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#111312] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#E6E8E6] shrink-0">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E6E8E6]">
          <Link to="/" className="text-lg font-bold tracking-tight text-[#111312] whitespace-nowrap">
            HelzerX
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2B7A19]">
            {portalLabel}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0D0F0E] text-white'
                      : 'text-[#4A504C] hover:bg-[#F3F5F3] hover:text-[#111312]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E6E8E6] space-y-3">
          {isStaff && (
            <Link
              to={location.pathname.startsWith('/admin') ? '/portal' : '/admin'}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#E9FAD6] text-[#2B7A19] hover:bg-[#dcf4c2]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {location.pathname.startsWith('/admin') ? 'Switch to Partner View' : 'Open Admin Console'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-[#0D0F0E] text-white flex items-center justify-center text-xs font-semibold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111312] truncate">{user?.fullName}</p>
              <p className="text-[11px] text-[#5A605C] truncate">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-[#E2E5E2] text-[#111312] hover:bg-[#F7F8F7] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-72 bg-white h-full flex flex-col border-r border-[#E6E8E6]">
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#E6E8E6]">
              <span className="text-lg font-bold">HelzerX · {portalLabel}</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg border border-[#E6E8E6]"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive ? 'bg-[#0D0F0E] text-white' : 'text-[#4A504C] hover:bg-[#F3F5F3]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#E6E8E6]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border border-[#E2E5E2]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-[#E6E8E6] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E6E8E6]"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Link to="/" className="text-[#5A605C] hover:text-[#111312] hidden sm:inline">
                HelzerX
              </Link>
              <span className="text-[#B8BEB9] hidden sm:inline">/</span>
              <h1 className="font-semibold text-[#111312] truncate">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/apply"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#9EE855] text-[#0D0F0E] hover:bg-[#8FDD42] whitespace-nowrap"
            >
              New Proposal
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
