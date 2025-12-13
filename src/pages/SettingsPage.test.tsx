import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock hooks
vi.mock('@/hooks', () => ({
  useExportEvents: vi.fn(),
}));

// Mock components
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-wrapper" data-title={title}>{children}</div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  Button: ({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
  ),
}));

vi.mock('@/components/ai', () => ({
  AISettingsForm: () => <div data-testid="ai-settings-form">AI Settings Form</div>,
}));

vi.mock('@/components/data', () => ({
  ImportModal: ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => (
    isOpen ? (
      <div data-testid="import-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Import Success</button>
      </div>
    ) : null
  ),
}));

import { useExportEvents } from '@/hooks';

const mockUseExportEvents = vi.mocked(useExportEvents);

const renderWithRouter = () => {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseExportEvents.mockReturnValue({
      exportAll: vi.fn(),
      isExporting: false,
      error: null,
    });
  });

  describe('page structure', () => {
    it('renders page wrapper with title', () => {
      renderWithRouter();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Settings');
    });

    it('renders all settings sections', () => {
      renderWithRouter();

      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('AI Configuration section', () => {
    it('renders AI settings form', () => {
      renderWithRouter();

      expect(screen.getByTestId('ai-settings-form')).toBeInTheDocument();
    });
  });

  describe('Appearance section', () => {
    it('shows theme selection options', () => {
      renderWithRouter();

      expect(screen.getByText('Choose your preferred theme for the application.')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  describe('Data Management section', () => {
    it('renders export section', () => {
      renderWithRouter();

      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText(/Download all your health events/)).toBeInTheDocument();
    });

    it('renders export buttons', () => {
      renderWithRouter();

      expect(screen.getByText('Export as JSON')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });

    it('renders import section', () => {
      renderWithRouter();

      expect(screen.getByText('Import Data')).toBeInTheDocument();
      expect(screen.getByText('Import from JSON')).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('calls exportAll with json format when clicking JSON button', () => {
      const mockExportAll = vi.fn();
      mockUseExportEvents.mockReturnValue({
        exportAll: mockExportAll,
        isExporting: false,
        error: null,
      });

      renderWithRouter();

      fireEvent.click(screen.getByText('Export as JSON'));

      expect(mockExportAll).toHaveBeenCalledWith({ format: 'json' });
    });

    it('calls exportAll with csv format when clicking CSV button', () => {
      const mockExportAll = vi.fn();
      mockUseExportEvents.mockReturnValue({
        exportAll: mockExportAll,
        isExporting: false,
        error: null,
      });

      renderWithRouter();

      fireEvent.click(screen.getByText('Export as CSV'));

      expect(mockExportAll).toHaveBeenCalledWith({ format: 'csv' });
    });

    it('disables export buttons when exporting', () => {
      mockUseExportEvents.mockReturnValue({
        exportAll: vi.fn(),
        isExporting: true,
        error: null,
      });

      renderWithRouter();

      const buttons = screen.getAllByText(/Exporting.../);
      buttons.forEach(button => {
        expect(button.closest('button')).toBeDisabled();
      });
    });

    it('shows exporting text when in progress', () => {
      mockUseExportEvents.mockReturnValue({
        exportAll: vi.fn(),
        isExporting: true,
        error: null,
      });

      renderWithRouter();

      expect(screen.getAllByText(/Exporting.../).length).toBeGreaterThan(0);
    });

    it('shows error message when export fails', () => {
      mockUseExportEvents.mockReturnValue({
        exportAll: vi.fn(),
        isExporting: false,
        error: 'Export failed',
      });

      renderWithRouter();

      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  describe('import functionality', () => {
    it('opens import modal when clicking import button', () => {
      renderWithRouter();

      expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Import from JSON'));

      expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    });

    it('closes import modal when close is triggered', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('Import from JSON'));
      expect(screen.getByTestId('import-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
    });
  });

  describe('Account section', () => {
    it('shows coming soon message', () => {
      renderWithRouter();

      expect(screen.getByText('Account management coming soon.')).toBeInTheDocument();
    });
  });
});
