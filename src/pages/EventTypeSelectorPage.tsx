import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/common';
import { EventTypeSelector } from '@/components/event';

export function EventTypeSelectorPage() {
  return (
    <PageWrapper
      title="Add New Event"
      action={
        <Link to="/timeline">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timeline
          </Button>
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto">
        <p className="text-theme-secondary mb-8 text-center">
          What type of health event would you like to record?
        </p>
        <EventTypeSelector />
      </div>
    </PageWrapper>
  );
}
