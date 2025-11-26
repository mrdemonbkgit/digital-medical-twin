import { Calendar, Plus } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome, {user?.email}
            </h2>
            <p className="mt-1 text-gray-600">
              Your digital medical twin is ready to track your health journey.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No health events yet</h3>
            <p className="mt-2 text-gray-600">
              Start tracking your health by adding your first event.
            </p>
            <Button className="mt-6" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Health Event
            </Button>
            <p className="mt-2 text-sm text-gray-500">
              Coming in Phase 2
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
