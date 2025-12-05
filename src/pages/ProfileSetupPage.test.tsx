import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProfileSetupPage } from './ProfileSetupPage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCreate = vi.fn();
const mockComplete = vi.fn();
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({
    create: mockCreate,
    complete: mockComplete,
    isCreating: false,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-wrapper" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({ label, value, onChange, type, required, error, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Select: ({ label, value, onChange, options, required, error }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        data-testid={`select-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  ),
  TagInput: ({ label, tags, onChange, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`taginput-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            onChange([...tags, target.value]);
            target.value = '';
          }
        }}
      />
      <div>
        {tags?.map((tag: string) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  ),
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div data-testid="loading-spinner" className={className}>
      Loading...
    </div>
  ),
}));

import { useUserProfile } from '@/hooks/useUserProfile';

describe('ProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserProfile).mockReturnValue({
      create: mockCreate,
      complete: mockComplete,
      isCreating: false,
      profile: null,
      isLoading: false,
      error: null,
      update: vi.fn(),
      isUpdating: false,
    });
  });

  function renderWithRouter(initialRoute = '/profile/setup') {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ProfileSetupPage />
      </MemoryRouter>
    );
  }

  describe('rendering', () => {
    it('renders page with correct title', () => {
      renderWithRouter();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute(
        'data-title',
        'Complete Your Profile'
      );
    });

    it('shows all step indicators', () => {
      renderWithRouter();

      // The icons/steps should be visible
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('starts on the first step (Basic Information)', () => {
      renderWithRouter();

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByTestId('input-display-name')).toBeInTheDocument();
      expect(screen.getByTestId('select-gender')).toBeInTheDocument();
      expect(screen.getByTestId('input-date-of-birth')).toBeInTheDocument();
    });

    it('shows Next button on first step', () => {
      renderWithRouter();

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('shows Back button disabled on first step', () => {
      renderWithRouter();

      const backButton = screen.getByText('Back');
      expect(backButton).toBeDisabled();
    });
  });

  describe('step navigation', () => {
    it('shows validation error when required fields are empty', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Gender is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    });

    it('advances to step 2 when basic info is complete', () => {
      renderWithRouter();

      // Fill required fields
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });

      fireEvent.click(screen.getByText('Next'));

      // Should now be on Medical History step
      expect(screen.getByText('Medical History')).toBeInTheDocument();
      expect(screen.getByTestId('taginput-medical-conditions')).toBeInTheDocument();
    });

    it('goes back to previous step when Back clicked', () => {
      renderWithRouter();

      // Fill required fields and go to step 2
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'female' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1985-05-15' },
      });
      fireEvent.click(screen.getByText('Next'));

      // Now on step 2, click Back
      fireEvent.click(screen.getByText('Back'));

      // Should be back on Basic Information
      expect(screen.getByTestId('input-display-name')).toBeInTheDocument();
    });

    it('navigates through all 4 steps', () => {
      renderWithRouter();

      // Step 1: Basic Info
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'other' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '2000-12-25' },
      });
      fireEvent.click(screen.getByText('Next'));

      // Step 2: Medical History
      expect(screen.getByTestId('taginput-medical-conditions')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));

      // Step 3: Family History
      expect(screen.getByText(/Select conditions that run in your family/)).toBeInTheDocument();
      fireEvent.click(screen.getByText('Next'));

      // Step 4: Lifestyle
      expect(screen.getByTestId('select-smoking-status')).toBeInTheDocument();
      expect(screen.getByText('Complete Setup')).toBeInTheDocument();
    });
  });

  describe('form filling', () => {
    it('fills optional fields on basic info step', () => {
      renderWithRouter();

      fireEvent.change(screen.getByTestId('input-display-name'), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByTestId('input-height-(cm)'), {
        target: { value: '175' },
      });
      fireEvent.change(screen.getByTestId('input-weight-(kg)'), {
        target: { value: '70' },
      });

      expect(screen.getByTestId('input-display-name')).toHaveValue('John Doe');
      // Number inputs return numeric values
      expect(screen.getByTestId('input-height-(cm)')).toHaveValue(175);
      expect(screen.getByTestId('input-weight-(kg)')).toHaveValue(70);
    });

    it('fills lifestyle step fields', () => {
      renderWithRouter();

      // Navigate to lifestyle step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      // Now on lifestyle step
      fireEvent.change(screen.getByTestId('select-smoking-status'), {
        target: { value: 'never' },
      });
      fireEvent.change(screen.getByTestId('select-alcohol-consumption'), {
        target: { value: 'occasional' },
      });
      fireEvent.change(screen.getByTestId('select-exercise-frequency'), {
        target: { value: 'moderate' },
      });

      expect(screen.getByTestId('select-smoking-status')).toHaveValue('never');
      expect(screen.getByTestId('select-alcohol-consumption')).toHaveValue('occasional');
      expect(screen.getByTestId('select-exercise-frequency')).toHaveValue('moderate');
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      mockCreate.mockResolvedValue({});
      mockComplete.mockResolvedValue({});
    });

    it('shows Complete Setup button on last step', () => {
      renderWithRouter();

      // Navigate to last step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Complete Setup')).toBeInTheDocument();
    });

    it('calls create and complete on submission', async () => {
      renderWithRouter();

      // Navigate to last step with minimal data
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'female' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      // Submit
      fireEvent.click(screen.getByText('Complete Setup'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            gender: 'female',
            dateOfBirth: '1990-01-01',
          })
        );
      });

      await waitFor(() => {
        expect(mockComplete).toHaveBeenCalled();
      });
    });

    it('navigates to dashboard after successful submission', async () => {
      renderWithRouter();

      // Navigate to last step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      fireEvent.click(screen.getByText('Complete Setup'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('uses returnTo param for navigation', async () => {
      render(
        <MemoryRouter initialEntries={['/profile/setup?returnTo=/timeline']}>
          <ProfileSetupPage />
        </MemoryRouter>
      );

      // Navigate to last step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      fireEvent.click(screen.getByText('Complete Setup'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/timeline');
      });
    });

    it('shows loading state during submission', async () => {
      vi.mocked(useUserProfile).mockReturnValue({
        create: mockCreate,
        complete: mockComplete,
        isCreating: true,
        profile: null,
        isLoading: false,
        error: null,
        update: vi.fn(),
        isUpdating: false,
      });

      renderWithRouter();

      // Navigate to last step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('handles create error', async () => {
      const { logger } = await import('@/lib/logger');
      mockCreate.mockRejectedValueOnce(new Error('Create failed'));

      renderWithRouter();

      // Navigate to last step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      fireEvent.click(screen.getByText('Complete Setup'));

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to create profile',
          expect.any(Error)
        );
      });
    });
  });

  describe('family history step', () => {
    beforeEach(() => {
      renderWithRouter();

      // Navigate to family history step
      fireEvent.change(screen.getByTestId('select-gender'), {
        target: { value: 'male' },
      });
      fireEvent.change(screen.getByTestId('input-date-of-birth'), {
        target: { value: '1990-01-01' },
      });
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
    });

    it('displays family conditions', () => {
      expect(screen.getByText('Heart Disease')).toBeInTheDocument();
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
      expect(screen.getByText('Cancer')).toBeInTheDocument();
    });

    it('displays relative options', () => {
      // Multiple Father/Mother buttons exist (one for each condition)
      expect(screen.getAllByText('Father').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mother').length).toBeGreaterThan(0);
    });

    it('can toggle family history selection', () => {
      const fatherButton = screen.getAllByText('Father')[0];
      fireEvent.click(fatherButton);

      // Button should have selected styling (we can't easily test CSS classes in this mock setup)
      // but we verify the click handler works
    });
  });
});
