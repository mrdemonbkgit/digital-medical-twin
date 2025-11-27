import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('rendering', () => {
    it('renders children when open', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<Modal {...defaultProps} title="Test" />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('renders close button without title', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role dialog', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'modal-title'
      );
    });

    it('does not have aria-labelledby when no title', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('has aria-label on close button', () => {
      render(<Modal {...defaultProps} title="Test" />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} title="Test" />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Find backdrop by aria-hidden attribute
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key pressed', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('body overflow', () => {
    it('sets body overflow to hidden when open', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('resets body overflow when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    it('resets body overflow on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('sizes', () => {
    it('applies default medium size', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });

    it('applies small size', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-sm');
    });

    it('applies large size', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('applies xl size', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-xl');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });

    it('renders fixed overlay', () => {
      render(<Modal {...defaultProps} />);
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('applies base styling classes', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-white', 'rounded-lg', 'shadow-xl');
    });
  });

  describe('event cleanup', () => {
    it('removes keydown listener when closed', () => {
      const onClose = vi.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />);

      // Verify listener is active
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);

      // Close modal
      rerender(<Modal {...defaultProps} isOpen={false} onClose={onClose} />);
      vi.clearAllMocks();

      // Verify listener is removed
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
