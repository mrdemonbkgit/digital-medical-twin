import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('renders email input', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders password input', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderLoginForm();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      renderLoginForm();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('email input has correct type', () => {
      renderLoginForm();
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('password input has correct type', () => {
      renderLoginForm();
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('form interaction', () => {
    it('updates email value on input', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password value on input', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('form submission', () => {
    it('calls login with email and password on valid submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('does not call login when email is invalid', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('does not call login when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      // Leave password empty
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('auth errors', () => {
    it('displays auth error from useAuth', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
      });

      renderLoginForm();

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('shows error in red error box', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
      });

      renderLoginForm();

      const errorBox = screen.getByText('Invalid credentials').closest('div');
      expect(errorBox).toHaveClass('bg-red-50');
    });
  });

  describe('loading state', () => {
    it('shows loading state on button when isLoading', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
      });

      renderLoginForm();

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeDisabled();
    });

    it('disables form submission when loading', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
      });

      renderLoginForm();

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has required attribute on email input', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
    });

    it('has required attribute on password input', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/password/i)).toBeRequired();
    });

    it('has autocomplete attributes', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});
