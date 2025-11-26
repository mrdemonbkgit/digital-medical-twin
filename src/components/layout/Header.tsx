import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings, Activity, Calendar, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error is handled by AuthContext
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              Digital Medical Twin
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to={ROUTES.DASHBOARD}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.DASHBOARD)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to={ROUTES.TIMELINE}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.TIMELINE)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(ROUTES.SETTINGS)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <span className="text-sm text-gray-600 hidden md:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
