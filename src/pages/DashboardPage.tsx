import { Link } from 'react-router-dom';
import { Calendar, Plus, ArrowRight, FileUp } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner, FullPageSpinner } from '@/components/common';
import { EventCard, eventTypes } from '@/components/event';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useEventMutation } from '@/hooks';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import { ROUTES } from '@/routes/routes';

export function DashboardPage() {
  const { user } = useAuth();
  const { isLoading: isProfileLoading, isComplete, profile } = useRequireProfile();
  const { events, isLoading, refetch } = useEvents({ pagination: { limit: 5 } });
  const { remove, isDeleting } = useEventMutation();

  // Show loading while checking profile status
  if (isProfileLoading) {
    return <FullPageSpinner />;
  }

  // Will redirect if profile not complete
  if (!isComplete) {
    return null;
  }

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      await refetch();
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        {/* Welcome card */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-theme-primary">
              Welcome back, {profile?.displayName || user?.email?.split('@')[0]}
            </h2>
            <p className="mt-1 text-theme-secondary">
              Your digital medical twin is tracking your health journey.
            </p>
          </CardContent>
        </Card>

        {/* Quick add section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {eventTypes.map(({ type, label, icon: Icon, colors }) => (
                <Link
                  key={type}
                  to={`/event/new/${type}`}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${colors.bg} ${colors.border} ${colors.hover}`}
                >
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <span className="text-sm font-medium text-theme-secondary">{label}</span>
                </Link>
              ))}
              {/* Upload Lab PDF quick action */}
              <Link
                to={ROUTES.LAB_UPLOADS}
                className="flex items-center gap-2 p-3 rounded-lg border-2 transition-all bg-info-muted border-info hover:opacity-80"
              >
                <FileUp className="w-5 h-5 text-info" />
                <span className="text-sm font-medium text-theme-secondary">Upload Lab</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link to="/timeline">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-theme-muted" />
                <h3 className="mt-4 text-lg font-medium text-theme-primary">
                  No health events yet
                </h3>
                <p className="mt-2 text-theme-secondary">
                  Start tracking your health by adding your first event.
                </p>
                <Link to="/event/new">
                  <Button className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Health Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
                {events.length >= 5 && (
                  <div className="text-center pt-2">
                    <Link to="/timeline">
                      <Button variant="secondary">
                        View All Events
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
