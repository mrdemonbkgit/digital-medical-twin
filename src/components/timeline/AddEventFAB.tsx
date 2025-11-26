import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/utils';

interface AddEventFABProps {
  className?: string;
}

/**
 * Floating Action Button for adding new events.
 * Fixed position bottom-right with hover effects.
 */
export function AddEventFAB({ className }: AddEventFABProps) {
  return (
    <Link
      to="/event/new"
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full bg-blue-600 text-white shadow-lg',
        'transition-all duration-200',
        'hover:scale-105 hover:bg-blue-700 hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'active:scale-95',
        className
      )}
      aria-label="Add new event"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
