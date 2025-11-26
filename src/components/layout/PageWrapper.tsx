import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function PageWrapper({ children, className, title, action }: PageWrapperProps) {
  return (
    <main className={cn('mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </main>
  );
}
