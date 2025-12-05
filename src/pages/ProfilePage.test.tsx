import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUpdate = vi.fn();
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(() => ({
    profile: null,
    isLoading: false,
    error: null,
    update: mockUpdate,
    isUpdating: false,
  })),
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
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
  Input: ({ label, value, onChange, type, required, error }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {error && <span>{error}</span>}
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
      {error && <span>{error}</span>}
    </div>
  ),
  TagInput: ({ label, tags, onChange, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <div data-testid={`taginput-${label?.toLowerCase().replace(/\s+/g, '-')}`}>
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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile = {
    id: 'user-1',
    userId: 'user-1',
    displayName: 'John Doe',
    gender: 'male' as const,
    dateOfBirth: '1990-05-15',
    heightCm: 175,
    weightKg: 70,
    medicalConditions: ['Diabetes'],
    currentMedications: ['Metformin'],
    allergies: ['Penicillin'],
    surgicalHistory: ['Appendectomy'],
    familyHistory: { heart_disease: ['father'] },
    smokingStatus: 'never' as const,
    alcoholFrequency: 'occasional' as const,
    exerciseFrequency: 'moderate' as const,
    isComplete: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  function renderWithRouter(ui: React.ReactElement) {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  }

  describe('loading state', () => {
    it('shows loading spinner while loading', () => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });

      renderWithRouter(<ProfilePage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: 'Failed to load profile',
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });

      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    it('shows setup button when no profile found', () => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });

      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Setup Profile')).toBeInTheDocument();
    });

    it('navigates to profile setup when clicking setup button', () => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });

      renderWithRouter(<ProfilePage />);

      fireEvent.click(screen.getByText('Setup Profile'));
      expect(mockNavigate).toHaveBeenCalledWith('/profile/setup');
    });
  });

  describe('profile display', () => {
    beforeEach(() => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });
    });

    it('renders profile page with title', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Your Profile');
    });

    it('displays basic information section', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
    });

    it('displays medical history section', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Medical History')).toBeInTheDocument();
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText('Penicillin')).toBeInTheDocument();
    });

    it('displays family history section', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Family History')).toBeInTheDocument();
      expect(screen.getByText(/Heart Disease:/)).toBeInTheDocument();
    });

    it('displays lifestyle section', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('Lifestyle')).toBeInTheDocument();
      expect(screen.getByText('Never smoked')).toBeInTheDocument();
      expect(screen.getByText('Occasional')).toBeInTheDocument();
      expect(screen.getByText('Moderate (3-4 days/week)')).toBeInTheDocument();
    });

    it('shows edit buttons for each section', () => {
      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBe(4); // basic, medical, family, lifestyle
    });

    it('calculates and displays BMI when height and weight available', () => {
      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('BMI')).toBeInTheDocument();
      // BMI = 70 / (1.75^2) = 22.9
      expect(screen.getByText(/22\.9/)).toBeInTheDocument();
    });

    it('shows none reported for empty medical conditions', () => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: { ...mockProfile, medicalConditions: [] },
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });

      renderWithRouter(<ProfilePage />);

      expect(screen.getByText('None reported')).toBeInTheDocument();
    });
  });

  describe('editing sections', () => {
    beforeEach(() => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });
    });

    it('shows edit form when clicking edit button', () => {
      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]); // Edit basic info

      expect(screen.getByTestId('input-display-name')).toBeInTheDocument();
      expect(screen.getByTestId('select-gender')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('cancels editing and restores view mode', () => {
      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('input-display-name')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByTestId('input-display-name')).not.toBeInTheDocument();
    });

    it('calls update when saving changes', async () => {
      mockUpdate.mockResolvedValueOnce({});

      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]); // Edit basic info

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('shows error message when save fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Save failed'));

      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });
  });

  describe('lifestyle editing', () => {
    beforeEach(() => {
      vi.mocked(useUserProfile).mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
        update: mockUpdate,
        isUpdating: false,
        create: vi.fn(),
        complete: vi.fn(),
        isCreating: false,
      });
    });

    it('shows lifestyle form fields when editing', () => {
      renderWithRouter(<ProfilePage />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[3]); // Edit lifestyle (4th section)

      expect(screen.getByTestId('select-smoking-status')).toBeInTheDocument();
      expect(screen.getByTestId('select-alcohol-consumption')).toBeInTheDocument();
      expect(screen.getByTestId('select-exercise-frequency')).toBeInTheDocument();
    });
  });
});
