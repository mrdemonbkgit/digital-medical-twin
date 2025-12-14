import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Calendar, Bot, FileUp, FolderOpen, Settings, TrendingUp, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ROUTES } from '@/routes/routes';
import { cn } from '@/utils/cn';

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.TIMELINE, icon: Calendar, label: 'Timeline' },
  { to: ROUTES.AI_CHAT, icon: Bot, label: 'AI Historian' },
  { to: ROUTES.LAB_UPLOADS, icon: FileUp, label: 'Labs' },
  { to: ROUTES.DOCUMENTS, icon: FolderOpen, label: 'Documents' },
  { to: ROUTES.INSIGHTS, icon: TrendingUp, label: 'Insights' },
  { to: ROUTES.SETTINGS, icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 rounded-lg hover:bg-theme-tertiary min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-72 bg-theme-primary z-50 transform transition-transform duration-200 ease-in-out shadow-xl overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-primary">
          <span className="font-semibold text-theme-primary">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-theme-tertiary min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-theme-primary bg-theme-secondary">
          <Link
            to={ROUTES.PROFILE}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-info-muted flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-theme-primary">
                {profile?.displayName || user?.email?.split('@')[0]}
              </p>
              <p className="text-sm text-theme-tertiary">{user?.email}</p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                location.pathname === to
                  ? 'bg-info-muted text-accent'
                  : 'text-theme-secondary hover:bg-theme-tertiary'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-theme-primary bg-theme-primary">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-theme-secondary hover:bg-theme-tertiary transition-colors min-h-[44px]"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
