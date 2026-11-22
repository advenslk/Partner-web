import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PublicLayout } from './components/Layout';
import HomePage from './pages/HomePage';
import {
  AboutPage,
  CapabilitiesPage,
  CaseStudiesPage,
  DivisionsPage,
  WhyPartnerPage,
} from './pages/CompanyPages';
import {
  ComparisonPage,
  DirectoryPage,
  OpportunitiesPage,
  PartnershipTypeDetailPage,
  ProcessPage,
  WhatWeExpectPage,
  WhatWeOfferPage,
} from './pages/PartnershipPages';
import { ContactPage, FaqPage, LegalPage, RequestMeetingPage } from './pages/SupportPages';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
} from './pages/AuthPages';

const ApplyPage = lazy(() => import('./pages/ApplyPage'));
const PartnerPortalPages = lazy(() => import('./pages/PartnerPortalPages'));
const AdminPortalPages = lazy(() => import('./pages/AdminPortalPages'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequireAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F7] text-sm text-[#5A605C]">
        Verifying session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireStaffGuard({ children }: { children: React.ReactNode }) {
  const { user, isStaff, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F7] text-sm text-[#5A605C]">
        Verifying administrative permissions...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isStaff) {
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#5A605C]">
      Loading HelzerX Portal...
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Website & Auth Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/divisions" element={<DivisionsPage />} />
              <Route path="/capabilities" element={<CapabilitiesPage />} />
              <Route path="/why-partner" element={<WhyPartnerPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/partnerships" element={<OpportunitiesPage />} />
              <Route path="/partnerships/:slug" element={<PartnershipTypeDetailPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/what-we-offer" element={<WhatWeOfferPage />} />
              <Route path="/what-we-expect" element={<WhatWeExpectPage />} />
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/case-studies" element={<CaseStudiesPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/request-meeting" element={<RequestMeetingPage />} />
              <Route path="/apply" element={<ApplyPage />} />
              <Route path="/legal/privacy" element={<LegalPage defaultSlug="privacy" />} />
              <Route path="/legal/terms" element={<LegalPage defaultSlug="terms" />} />
              <Route path="/legal/:docSlug" element={<LegalPage />} />

              {/* Auth Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Route>

            {/* Authenticated Partner Portal */}
            <Route
              path="/portal/*"
              element={
                <RequireAuthGuard>
                  <PartnerPortalPages />
                </RequireAuthGuard>
              }
            />

            {/* Role-Restricted Admin Portal */}
            <Route
              path="/admin/*"
              element={
                <RequireStaffGuard>
                  <AdminPortalPages />
                </RequireStaffGuard>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
