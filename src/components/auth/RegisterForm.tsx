import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { validateRegisterForm } from '@/utils/validation';
import { ROUTES } from '@/routes/routes';

export function RegisterForm() {
  const { register, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const validation = validateRegisterForm(email, password, confirmPassword);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await register({ email, password });
    } catch {
      // Error is handled by AuthContext
    }
  };

  const displayErrors = validationErrors.length > 0 ? validationErrors : error ? [error] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayErrors.length > 0 && (
        <div className="rounded-lg bg-danger-muted p-3">
          {displayErrors.map((err, i) => (
            <p key={i} className="text-sm text-danger">{err}</p>
          ))}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-theme-secondary">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:opacity-80">
          Sign in
        </Link>
      </p>
    </form>
  );
}
