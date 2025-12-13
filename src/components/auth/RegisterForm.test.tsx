import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';

// Mock useAuth hook
const mockRegister = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderRegisterForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  describe('rendering', () => {
    it('renders email input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders password input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('renders confirm password input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderRegisterForm();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders sign in link', () => {
      renderRegisterForm();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('email input has correct type', () => {
      renderRegisterForm();
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('password inputs have correct type', () => {
      renderRegisterForm();
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'password');
    });
  });

  describe('form interaction', () => {
    it('updates email value on input', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password value on input', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('updates confirm password value on input', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'password123');

      expect(confirmInput).toHaveValue('password123');
    });
  });

  describe('form submission', () => {
    it('calls register with email and password on valid submit', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);
      renderRegisterForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('does not call register when email is invalid', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('does not call register when password is too short', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('does not call register when passwords do not match', async () => {
      const user = userEvent.setup();
      renderRegisterForm();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different456');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('auth errors', () => {
    it('displays auth error from useAuth', () => {
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Email already in use',
      });

      renderRegisterForm();

      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });

    it('shows error in danger error box', () => {
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Email already in use',
      });

      renderRegisterForm();

      const errorBox = screen.getByText('Email already in use').closest('div');
      expect(errorBox).toHaveClass('bg-danger-muted');
    });
  });

  describe('loading state', () => {
    it('shows loading state on button when isLoading', () => {
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
      });

      renderRegisterForm();

      const button = screen.getByRole('button', { name: /create account/i });
      expect(button).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has required attribute on email input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
    });

    it('has required attribute on password input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    });

    it('has required attribute on confirm password input', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
    });

    it('has autocomplete attributes', () => {
      renderRegisterForm();
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('autocomplete', 'new-password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('autocomplete', 'new-password');
    });
  });
});
