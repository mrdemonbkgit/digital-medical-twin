import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings, Activity, Calendar, LayoutDashboard, Bot, User, FileUp, FolderOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/common';
import { MobileNav } from './MobileNav';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';

export function Header() {
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();
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
    <header className="border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Mobile navigation */}
          <MobileNav />

          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-zinc-100 hidden sm:inline">
              Digital Medical Twin
            </span>
          </Link>

          {/* Desktop navigation - hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to={ROUTES.DASHBOARD}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.DASHBOARD)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
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
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Link>
            <Link
              to={ROUTES.AI_CHAT}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.AI_CHAT)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Historian</span>
            </Link>
            <Link
              to={ROUTES.LAB_UPLOADS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.LAB_UPLOADS) || isActive(ROUTES.BIOMARKERS)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">Labs</span>
            </Link>
            <Link
              to={ROUTES.DOCUMENTS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.DOCUMENTS)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </Link>
            <Link
              to={ROUTES.INSIGHTS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.INSIGHTS)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </Link>
          </nav>
        </div>

        {/* Desktop right side - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            to={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(ROUTES.SETTINGS)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-zinc-700">
            <Link
              to={ROUTES.PROFILE}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.PROFILE)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">
                {profile?.displayName || user?.email?.split('@')[0]}
              </span>
            </Link>
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
