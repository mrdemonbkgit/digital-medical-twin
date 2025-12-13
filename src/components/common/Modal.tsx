import { useEffect, useCallback, type ReactNode } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: false, // We handle Escape manually
        allowOutsideClick: true,
      }}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal content */}
        <div
          className={cn(
            'relative w-full mx-4 bg-theme-primary border border-theme-secondary rounded-lg shadow-xl',
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme-primary">
              <h2
                id="modal-title"
                className="text-lg font-semibold text-theme-primary"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 min-w-[44px] min-h-[44px] text-theme-muted hover:text-theme-secondary rounded-full hover:bg-theme-tertiary flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className={cn('px-6 py-4', !title && 'pt-6')}>
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 min-w-[44px] min-h-[44px] text-theme-muted hover:text-theme-secondary rounded-full hover:bg-theme-tertiary flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
