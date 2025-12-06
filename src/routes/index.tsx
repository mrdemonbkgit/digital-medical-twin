import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import { FullPageSpinner } from '@/components/common';
import { ROUTES } from './routes';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const TimelinePage = lazy(() => import('@/pages/TimelinePage').then((m) => ({ default: m.TimelinePage })));
const EventTypeSelectorPage = lazy(() => import('@/pages/EventTypeSelectorPage').then((m) => ({ default: m.EventTypeSelectorPage })));
const EventNewPage = lazy(() => import('@/pages/EventNewPage').then((m) => ({ default: m.EventNewPage })));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const AIHistorianPage = lazy(() => import('@/pages/AIHistorianPage').then((m) => ({ default: m.AIHistorianPage })));
const LabUploadsPage = lazy(() => import('@/pages/LabUploadsPage').then((m) => ({ default: m.LabUploadsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ProfileSetupPage = lazy(() => import('@/pages/ProfileSetupPage').then((m) => ({ default: m.ProfileSetupPage })));
const BiomarkersPage = lazy(() => import('@/pages/BiomarkersPage').then((m) => ({ default: m.BiomarkersPage })));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const InsightsPage = lazy(() => import('@/pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const InsightsDetailPage = lazy(() => import('@/pages/InsightsDetailPage').then((m) => ({ default: m.InsightsDetailPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.TIMELINE} element={<TimelinePage />} />
            <Route path={ROUTES.EVENT_NEW} element={<EventTypeSelectorPage />} />
            <Route path={ROUTES.EVENT_NEW_TYPE} element={<EventNewPage />} />
            <Route path={ROUTES.EVENT_DETAIL} element={<EventDetailPage />} />
            <Route path={ROUTES.AI_CHAT} element={<AIHistorianPage />} />
            <Route path={ROUTES.LAB_UPLOADS} element={<LabUploadsPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.PROFILE_SETUP} element={<ProfileSetupPage />} />
            <Route path={ROUTES.BIOMARKERS} element={<BiomarkersPage />} />
            <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
            <Route path={ROUTES.INSIGHTS} element={<InsightsPage />} />
            <Route path={ROUTES.INSIGHTS_DETAIL} element={<InsightsDetailPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
