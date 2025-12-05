import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageWrapper } from './PageWrapper';

describe('PageWrapper', () => {
  describe('children', () => {
    it('renders children content', () => {
      render(
        <PageWrapper>
          <div data-testid="content">Page Content</div>
        </PageWrapper>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <PageWrapper>
          <div>First</div>
          <div>Second</div>
        </PageWrapper>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('renders title when provided', () => {
      render(
        <PageWrapper title="Dashboard">
          <div>Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    it('does not render title header when not provided', () => {
      render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders title with correct styling', () => {
      render(
        <PageWrapper title="Settings">
          <div>Content</div>
        </PageWrapper>
      );

      const title = screen.getByRole('heading');
      expect(title).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
    });
  });

  describe('action', () => {
    it('renders action when provided', () => {
      render(
        <PageWrapper action={<button>Add New</button>}>
          <div>Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
    });

    it('renders action alongside title', () => {
      render(
        <PageWrapper title="Items" action={<button>Create</button>}>
          <div>Content</div>
        </PageWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Items' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('does not render header row when no title or action', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );

      expect(container.querySelector('.mb-6')).not.toBeInTheDocument();
    });
  });

  describe('fullWidth', () => {
    it('applies max-width constraint by default', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('max-w-7xl', 'mx-auto');
    });

    it('removes max-width constraint when fullWidth is true', () => {
      const { container } = render(
        <PageWrapper fullWidth>
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).not.toHaveClass('max-w-7xl', 'mx-auto');
    });

    it('applies different padding when fullWidth', () => {
      const { container } = render(
        <PageWrapper fullWidth>
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('py-4');
    });
  });

  describe('className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <PageWrapper className="custom-class">
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <PageWrapper className="extra-padding">
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('extra-padding', 'px-4');
    });
  });

  describe('main element', () => {
    it('renders as main element for semantics', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );

      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('has responsive padding', () => {
      const { container } = render(
        <PageWrapper>
          <div>Content</div>
        </PageWrapper>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });
});
