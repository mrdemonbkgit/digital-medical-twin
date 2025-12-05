import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('./Button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error for error boundary tests
const originalError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('normal rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error UI when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error description message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText(/unexpected error occurred/)).toBeInTheDocument();
    });

    it('shows Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows Refresh Page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('renders alert icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('shows custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('onError callback', () => {
    it('calls onError when error occurs', () => {
      const mockOnError = vi.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockOnError.mock.calls[0][0].message).toBe('Test error');
    });

    it('passes error info to onError', () => {
      const mockOnError = vi.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const errorInfo = mockOnError.mock.calls[0][1];
      expect(errorInfo).toHaveProperty('componentStack');
    });
  });

  describe('reset functionality', () => {
    it('calls handleReset when Try Again clicked', () => {
      const mockOnReset = vi.fn();

      render(
        <ErrorBoundary onReset={mockOnReset}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click Try Again - this should trigger the reset
      fireEvent.click(screen.getByText('Try Again'));

      // Verify onReset callback was called (indicating handleReset was triggered)
      expect(mockOnReset).toHaveBeenCalled();
    });

  });

  describe('page reload', () => {
    it('reloads page when Refresh Page clicked', () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Refresh Page'));

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('logs error using structured logger', async () => {
      const { logger } = await import('@/lib/logger');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalledWith(
        'React ErrorBoundary caught error',
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('wraps component with error boundary', () => {
    function MyComponent() {
      return <div data-testid="my-component">My Component</div>;
    }

    const WrappedComponent = withErrorBoundary(MyComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('my-component')).toBeInTheDocument();
  });

  it('catches errors from wrapped component', () => {
    function FailingComponent(): JSX.Element {
      throw new Error('Component failed');
    }

    const WrappedComponent = withErrorBoundary(FailingComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    function MyComponent({ message }: { message: string }) {
      return <div>{message}</div>;
    }

    const WrappedComponent = withErrorBoundary(MyComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('accepts error boundary props', () => {
    function FailingComponent(): JSX.Element {
      throw new Error('Failed');
    }

    const WrappedComponent = withErrorBoundary(FailingComponent, {
      fallback: <div>Custom fallback</div>,
    });

    render(<WrappedComponent />);

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });
});
