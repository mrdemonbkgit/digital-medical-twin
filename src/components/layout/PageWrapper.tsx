import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function PageWrapper({ children, className, title }: PageWrapperProps) {
  return (
    <main className={cn('mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}>
      {title && (
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>
      )}
      {children}
    </main>
  );
}
