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
    <header className="border-b border-theme-primary bg-theme-tertiary">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Mobile navigation */}
          <MobileNav />

          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-accent" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[10px] font-medium text-theme-tertiary uppercase tracking-wider">Digital</span>
              <span className="text-sm font-bold text-theme-primary -mt-0.5">MedTwin</span>
            </div>
          </Link>

          {/* Desktop navigation - hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to={ROUTES.DASHBOARD}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.DASHBOARD)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              Dashboard
            </Link>
            <Link
              to={ROUTES.TIMELINE}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.TIMELINE)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              Timeline
            </Link>
            <Link
              to={ROUTES.AI_CHAT}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.AI_CHAT)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <Bot className="h-4 w-4 flex-shrink-0" />
              AI Historian
            </Link>
            <Link
              to={ROUTES.LAB_UPLOADS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.LAB_UPLOADS) || isActive(ROUTES.BIOMARKERS)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <FileUp className="h-4 w-4 flex-shrink-0" />
              Labs
            </Link>
            <Link
              to={ROUTES.DOCUMENTS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.DOCUMENTS)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              Documents
            </Link>
            <Link
              to={ROUTES.INSIGHTS}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isActive(ROUTES.INSIGHTS)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
              )}
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              Insights
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
                ? 'bg-info-muted text-accent'
                : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-theme-primary">
            <Link
              to={ROUTES.PROFILE}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive(ROUTES.PROFILE)
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
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
