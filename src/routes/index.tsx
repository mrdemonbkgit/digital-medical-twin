import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth';
import { AppLayout } from '@/components/layout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { EventTypeSelectorPage } from '@/pages/EventTypeSelectorPage';
import { EventNewPage } from '@/pages/EventNewPage';
import { EventDetailPage } from '@/pages/EventDetailPage';
import { AIHistorianPage } from '@/pages/AIHistorianPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from './routes';

export function AppRoutes() {
  return (
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
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
