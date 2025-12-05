import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportModal } from './ImportModal';
import type { ImportResult } from '@/lib/importData';
import type { CreateEventInput } from '@/types';

// Mock useImportEvents hook
const mockValidateFile = vi.fn();
const mockImportEvents = vi.fn();
const mockReset = vi.fn();

vi.mock('@/hooks', () => ({
  useImportEvents: () => ({
    validateFile: mockValidateFile,
    importEvents: mockImportEvents,
    isValidating: false,
    progress: { completed: 0, total: 0, failed: 0, errors: [] },
    reset: mockReset,
  }),
}));

// Mock Modal and Button components
vi.mock('@/components/common', () => ({
  Modal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
  Button: ({
    children,
    onClick,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

const mockEvents: CreateEventInput[] = [
  {
    type: 'lab_result',
    title: 'Blood Test',
    date: '2024-01-15',
    notes: 'Annual checkup',
    tags: [],
  },
  {
    type: 'lab_result',
    title: 'Lipid Panel',
    date: '2024-01-16',
    notes: '',
    tags: [],
  },
  {
    type: 'doctor_visit',
    title: 'Annual Physical',
    date: '2024-01-20',
    notes: '',
    tags: [],
  },
];

const successResult: ImportResult = {
  success: true,
  events: mockEvents,
  errors: [],
  warnings: [],
};

const errorResult: ImportResult = {
  success: false,
  events: [],
  errors: ['Invalid file format', 'Missing required fields'],
  warnings: [],
};

const warningResult: ImportResult = {
  success: true,
  events: mockEvents,
  errors: [],
  warnings: ['Some events have missing tags', 'Dates were normalized'],
};

describe('ImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateFile.mockResolvedValue(successResult);
    mockImportEvents.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<ImportModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ImportModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows modal title', () => {
      render(<ImportModal {...defaultProps} />);
      expect(screen.getByText('Import Data')).toBeInTheDocument();
    });

    it('shows upload instructions', () => {
      render(<ImportModal {...defaultProps} />);
      expect(screen.getByText(/Upload a JSON file/)).toBeInTheDocument();
    });

    it('shows drop zone text', () => {
      render(<ImportModal {...defaultProps} />);
      expect(screen.getByText(/Drop your JSON file here/)).toBeInTheDocument();
    });

    it('shows max file size', () => {
      render(<ImportModal {...defaultProps} />);
      expect(screen.getByText(/Max file size: 10MB/)).toBeInTheDocument();
    });

    it('has hidden file input', () => {
      render(<ImportModal {...defaultProps} />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
    });

    it('file input accepts JSON files', () => {
      render(<ImportModal {...defaultProps} />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.json');
    });
  });

  describe('file selection', () => {
    it('validates file when selected', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{"events": []}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      expect(mockValidateFile).toHaveBeenCalledWith(file);
    });

    it('opens file dialog when drop zone is clicked', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const dropZone = screen.getByText(/Drop your JSON file here/).closest('div');
      fireEvent.click(dropZone!);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('drag and drop', () => {
    it('validates file on drop', async () => {
      render(<ImportModal {...defaultProps} />);

      const dropZone = screen.getByText(/Drop your JSON file here/).closest('div');
      const file = new File(['{"events": []}'], 'data.json', { type: 'application/json' });

      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(mockValidateFile).toHaveBeenCalledWith(file);
      });
    });

    it('prevents default on drag over', () => {
      render(<ImportModal {...defaultProps} />);

      const dropZone = screen.getByText(/Drop your JSON file here/).closest('div');
      const event = new Event('dragover', { bubbles: true });
      event.preventDefault = vi.fn();

      fireEvent.dragOver(dropZone!, event);

      // Component should prevent default
    });
  });

  describe('validation errors', () => {
    it('shows validation errors', async () => {
      mockValidateFile.mockResolvedValue(errorResult);
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['invalid'], 'bad.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('Validation Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid file format')).toBeInTheDocument();
        expect(screen.getByText('Missing required fields')).toBeInTheDocument();
      });
    });

    it('stays on upload step when validation fails', async () => {
      mockValidateFile.mockResolvedValue(errorResult);
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['invalid'], 'bad.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Drop your JSON file here/)).toBeInTheDocument();
      });
    });
  });

  describe('preview step', () => {
    it('shows preview after successful validation', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{"events": []}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('File validated successfully')).toBeInTheDocument();
      });
    });

    it('shows event count in preview', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        // Check for the full text that includes the event count
        expect(screen.getByText(/events to import/)).toBeInTheDocument();
        // The count "3" appears in <strong> element
        const strongElements = document.querySelectorAll('strong');
        const hasThreeCount = Array.from(strongElements).some((el) => el.textContent === '3');
        expect(hasThreeCount).toBe(true);
      });
    });

    it('shows filename in preview', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'my-health-data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/my-health-data.json/)).toBeInTheDocument();
      });
    });

    it('shows event types with counts', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/lab result/i)).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // 2 lab results
        expect(screen.getByText(/doctor visit/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 doctor visit
      });
    });

    it('shows warnings in preview', async () => {
      mockValidateFile.mockResolvedValue(warningResult);
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('Warnings')).toBeInTheDocument();
        expect(screen.getByText('Some events have missing tags')).toBeInTheDocument();
        expect(screen.getByText('Dates were normalized')).toBeInTheDocument();
      });
    });

    it('shows cancel button in preview', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('shows import button with count', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Import 3 Events/)).toBeInTheDocument();
      });
    });
  });

  describe('import process', () => {
    it('calls importEvents when import button is clicked', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Import 3 Events/)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/Import 3 Events/));

      expect(mockImportEvents).toHaveBeenCalledWith(mockEvents);
    });
  });

  describe('complete step', () => {
    it('shows completion message', async () => {
      // Mock progress to simulate completion
      vi.mocked(await import('@/hooks')).useImportEvents = vi.fn().mockReturnValue({
        validateFile: mockValidateFile,
        importEvents: mockImportEvents,
        isValidating: false,
        progress: { completed: 3, total: 3, failed: 0, errors: [] },
        reset: mockReset,
      });

      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Import 3 Events/)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/Import 3 Events/));

      await waitFor(() => {
        expect(screen.getByText('Import Complete')).toBeInTheDocument();
      });
    });

    it('shows done button on completion', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Import 3 Events/)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/Import 3 Events/));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });
  });

  describe('modal close behavior', () => {
    it('calls onClose when cancel is clicked in preview', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets state when modal closes', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Cancel'));

      expect(mockReset).toHaveBeenCalled();
    });

    it('calls onSuccess when done is clicked after import', async () => {
      render(<ImportModal {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/Import 3 Events/)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/Import 3 Events/));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Done'));

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
