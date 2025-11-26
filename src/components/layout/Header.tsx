import { Link } from 'react-router-dom';
import { LogOut, Settings, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common';
import { ROUTES } from '@/routes/routes';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Digital Medical Twin</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to={ROUTES.SETTINGS}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
