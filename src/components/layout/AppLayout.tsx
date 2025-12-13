import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ErrorBoundary } from '@/components/common';

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-theme-secondary">
      <Header />
      <ErrorBoundary key={location.pathname}>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
