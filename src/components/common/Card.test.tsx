import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('Card', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as a div', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('accepts nested elements', () => {
      render(
        <Card>
          <span data-testid="nested">Nested content</span>
        </Card>
      );
      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has rounded border', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('has border styling', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('border');
      expect(container.firstChild).toHaveClass('border-theme-primary');
    });

    it('has theme background', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('bg-theme-primary');
    });

    it('has padding', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('p-6');
    });

    it('has shadow', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('shadow-sm');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional props', () => {
      render(<Card data-testid="test-card" id="my-card">Content</Card>);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('id', 'my-card');
    });

    it('passes through event handlers', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Content</Card>);
      screen.getByText('Content').click();
      expect(handleClick).toHaveBeenCalled();
    });
  });
});

describe('CardHeader', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders as a div', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  describe('styling', () => {
    it('has bottom margin', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.firstChild).toHaveClass('mb-4');
    });

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom-class">Header</CardHeader>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional props', () => {
      render(<CardHeader data-testid="header" id="my-header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveAttribute('id', 'my-header');
    });
  });
});

describe('CardTitle', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText('Title text')).toBeInTheDocument();
    });

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has large font size', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild).toHaveClass('text-lg');
    });

    it('has semibold font weight', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild).toHaveClass('font-semibold');
    });

    it('has theme primary text color', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild).toHaveClass('text-theme-primary');
    });

    it('applies custom className', () => {
      const { container } = render(<CardTitle className="custom-class">Title</CardTitle>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional props', () => {
      render(<CardTitle data-testid="title" id="my-title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('id', 'my-title');
    });
  });
});

describe('CardContent', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('renders as a div', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<CardContent className="custom-class">Content</CardContent>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional props', () => {
      render(<CardContent data-testid="content" id="my-content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('id', 'my-content');
    });
  });
});

describe('Card composition', () => {
  it('works with nested card components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('maintains proper DOM structure', () => {
    const { container } = render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Title</CardTitle>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
      </Card>
    );

    const card = screen.getByTestId('card');
    const header = screen.getByTestId('header');
    const title = screen.getByTestId('title');
    const content = screen.getByTestId('content');

    expect(card).toContainElement(header);
    expect(card).toContainElement(content);
    expect(header).toContainElement(title);
  });
});
