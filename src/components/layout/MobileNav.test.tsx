import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from './MobileNav';

// Mock hooks
const mockLogout = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    logout: mockLogout,
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { displayName: 'Test User' },
  }),
}));

// Mock routes
vi.mock('@/routes/routes', () => ({
  ROUTES: {
    DASHBOARD: '/dashboard',
    TIMELINE: '/timeline',
    AI_CHAT: '/ai',
    LAB_UPLOADS: '/labs',
    INSIGHTS: '/insights',
    SETTINGS: '/settings',
    PROFILE: '/profile',
  },
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders hamburger menu button', () => {
      renderWithRouter(<MobileNav />);
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('drawer is hidden by default', () => {
      renderWithRouter(<MobileNav />);
      // Drawer is always in DOM but hidden via CSS transform
      const drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });
  });

  describe('drawer interactions', () => {
    it('opens drawer when hamburger clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('closes drawer when X button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      // Open drawer
      await user.click(screen.getByLabelText('Open menu'));
      let drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('translate-x-0');

      // Close drawer
      await user.click(screen.getByLabelText('Close menu'));
      drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });

    it('closes drawer when overlay clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      // Open drawer
      await user.click(screen.getByLabelText('Open menu'));

      // Click overlay (the element with bg-black/50 class)
      const overlay = document.querySelector('.bg-black\\/50');
      if (overlay) {
        await user.click(overlay);
      }

      const drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });
  });

  describe('user info', () => {
    it('displays user display name when drawer open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email when drawer open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('renders all nav items when open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('AI Historian')).toBeInTheDocument();
      expect(screen.getByText('Labs')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('closes drawer when nav link clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      await user.click(screen.getByText('Dashboard'));

      const drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });

    it('highlights active route', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />, { route: '/dashboard' });

      await user.click(screen.getByLabelText('Open menu'));

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink?.className).toContain('bg-blue-50');
    });

    it('closes drawer when profile link clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      await user.click(screen.getByText('Test User'));

      const drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });
  });

  describe('logout', () => {
    it('renders logout button when open', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls logout and closes drawer when logout clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      await user.click(screen.getByText('Logout'));

      expect(mockLogout).toHaveBeenCalled();
      const drawer = document.querySelector('[class*="fixed inset-y-0"]');
      expect(drawer?.className).toContain('-translate-x-full');
    });

    it('handles logout error gracefully', async () => {
      const user = userEvent.setup();
      mockLogout.mockRejectedValueOnce(new Error('Logout failed'));

      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      // Should not throw
      await user.click(screen.getByText('Logout'));

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('link hrefs', () => {
    it('dashboard link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('timeline link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const timelineLink = screen.getByText('Timeline').closest('a');
      expect(timelineLink).toHaveAttribute('href', '/timeline');
    });

    it('AI chat link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const aiLink = screen.getByText('AI Historian').closest('a');
      expect(aiLink).toHaveAttribute('href', '/ai');
    });

    it('labs link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const labsLink = screen.getByText('Labs').closest('a');
      expect(labsLink).toHaveAttribute('href', '/labs');
    });

    it('insights link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const insightsLink = screen.getByText('Insights').closest('a');
      expect(insightsLink).toHaveAttribute('href', '/insights');
    });

    it('settings link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('profile link has correct href', async () => {
      const user = userEvent.setup();
      renderWithRouter(<MobileNav />);

      await user.click(screen.getByLabelText('Open menu'));
      const profileLink = screen.getByText('Test User').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });
});
