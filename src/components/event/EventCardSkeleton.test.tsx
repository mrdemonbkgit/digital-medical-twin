import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCardSkeleton, EventCardSkeletonList } from './EventCardSkeleton';

describe('EventCardSkeleton', () => {
  describe('rendering', () => {
    it('renders skeleton container', () => {
      const { container } = render(<EventCardSkeleton />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('has animate-pulse class for loading animation', () => {
      const { container } = render(<EventCardSkeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('has rounded-lg border styling', () => {
      const { container } = render(<EventCardSkeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-lg', 'border', 'border-gray-200');
    });
  });

  describe('structure', () => {
    it('renders icon placeholder', () => {
      const { container } = render(<EventCardSkeleton />);

      const iconPlaceholder = container.querySelector('.h-9.w-9');
      expect(iconPlaceholder).toBeInTheDocument();
    });

    it('renders title placeholder', () => {
      const { container } = render(<EventCardSkeleton />);

      const titlePlaceholder = container.querySelector('.h-5.w-3\\/4');
      expect(titlePlaceholder).toBeInTheDocument();
    });

    it('renders action button placeholders', () => {
      const { container } = render(<EventCardSkeleton />);

      const actionButtons = container.querySelectorAll('.h-8.w-8');
      expect(actionButtons.length).toBe(3);
    });
  });
});

describe('EventCardSkeletonList', () => {
  describe('default count', () => {
    it('renders 3 skeletons by default', () => {
      const { container } = render(<EventCardSkeletonList />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });
  });

  describe('custom count', () => {
    it('renders specified number of skeletons', () => {
      const { container } = render(<EventCardSkeletonList count={5} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(5);
    });

    it('renders 1 skeleton when count is 1', () => {
      const { container } = render(<EventCardSkeletonList count={1} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(1);
    });

    it('renders 0 skeletons when count is 0', () => {
      const { container } = render(<EventCardSkeletonList count={0} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
    });
  });

  describe('styling', () => {
    it('has space-y-4 for vertical spacing', () => {
      const { container } = render(<EventCardSkeletonList />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });
  });
});
