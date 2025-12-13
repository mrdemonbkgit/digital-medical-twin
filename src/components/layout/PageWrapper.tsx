import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  fullWidth?: boolean;
}

export function PageWrapper({ children, className, title, action, fullWidth }: PageWrapperProps) {
  return (
    <main className={cn(fullWidth ? 'px-4 py-4 sm:px-6 lg:px-8' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold text-theme-primary">{title}</h1>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </main>
  );
}
