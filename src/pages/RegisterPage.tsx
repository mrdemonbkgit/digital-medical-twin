import { Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/common';
import { RegisterForm } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/routes';

export function RegisterPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Activity className="mx-auto h-12 w-12 text-accent" />
          <h1 className="mt-4 text-2xl font-bold text-theme-primary">Digital Medical Twin</h1>
          <p className="mt-2 text-theme-secondary">Create your account</p>
        </div>

        <Card>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
