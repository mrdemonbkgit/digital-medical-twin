import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock components
vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/auth', () => ({
  RegisterForm: () => <form data-testid="register-form">Register Form</form>,
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      } as ReturnType<typeof useAuth>);
    });

    it('renders register page', () => {
      renderWithRouter();

      expect(screen.getByText('Digital Medical Twin')).toBeInTheDocument();
      expect(screen.getByText('Create your account')).toBeInTheDocument();
    });

    it('renders register form', () => {
      renderWithRouter();

      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('renders card container', () => {
      renderWithRouter();

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { email: 'test@example.com' },
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
      } as ReturnType<typeof useAuth>);
    });

    it('redirects to dashboard', () => {
      renderWithRouter();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    });
  });
});
