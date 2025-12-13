import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { validateLoginForm } from '@/utils/validation';
import { ROUTES } from '@/routes/routes';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await login({ email, password });
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
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-theme-secondary">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-accent hover:opacity-80">
          Sign up
        </Link>
      </p>
    </form>
  );
}
