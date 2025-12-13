import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet } from './BottomSheet';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('BottomSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('does not render when closed', () => {
      render(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} title="My Sheet">
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByText('My Sheet')).toBeInTheDocument();
    });

    it('renders drag handle', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      // Drag handle is a div with rounded-full class
      const dragHandle = document.querySelector('.rounded-full');
      expect(dragHandle).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('closes when backdrop clicked', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      // Backdrop is the first fixed element
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close on Escape when already closed', () => {
      render(
        <BottomSheet isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('uses title as aria-label when provided', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Test Title');
    });

    it('uses default aria-label when no title', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Bottom sheet');
    });
  });

  describe('drag behavior', () => {
    it('handles touch drag down to close', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      // Find the drag handle container (has cursor-grab class)
      const dragHandle = document.querySelector('.cursor-grab');

      // Simulate touch drag
      fireEvent.touchStart(dragHandle!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(dragHandle!, { touches: [{ clientY: 250 }] }); // Drag down 150px
      fireEvent.touchEnd(dragHandle!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close on small drag', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      const dragHandle = document.querySelector('.cursor-grab');

      // Simulate small touch drag (less than threshold)
      fireEvent.touchStart(dragHandle!, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(dragHandle!, { touches: [{ clientY: 150 }] }); // Drag down 50px
      fireEvent.touchEnd(dragHandle!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('snap points', () => {
    it('uses default snap points', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </BottomSheet>
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet.style.height).toBe('50vh'); // Default first snap point is 0.5
    });

    it('uses custom snap points', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} snapPoints={[0.3, 0.7]}>
          <div>Content</div>
        </BottomSheet>
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet.style.height).toBe('30vh');
    });

    it('uses initial snap index', () => {
      render(
        <BottomSheet isOpen={true} onClose={mockOnClose} snapPoints={[0.3, 0.7]} initialSnap={1}>
          <div>Content</div>
        </BottomSheet>
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet.style.height).toBe('70vh');
    });
  });
});
