import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ExtractionPreview } from './ExtractionPreview';
import type { LabUpload, ProcessedBiomarker } from '@/types';

const mockProcessedBiomarkers: ProcessedBiomarker[] = [
  {
    originalName: 'LDL Cholesterol',
    originalValue: 120,
    originalUnit: 'mg/dL',
    standardCode: 'LDL',
    standardName: 'LDL Cholesterol',
    standardValue: 120,
    standardUnit: 'mg/dL',
    referenceMin: 0,
    referenceMax: 100,
    flag: 'high',
    matched: true,
  },
  {
    originalName: 'High Density Lipoprotein',
    originalValue: 1.42,
    originalUnit: 'mmol/L',
    standardCode: 'HDL',
    standardName: 'HDL Cholesterol',
    standardValue: 55,
    standardUnit: 'mg/dL',
    referenceMin: 40,
    referenceMax: 60,
    flag: 'normal',
    matched: true,
  },
  {
    originalName: 'Unknown Biomarker XYZ',
    originalValue: 25,
    originalUnit: 'U/L',
    standardCode: null,
    standardName: null,
    standardValue: null,
    standardUnit: null,
    referenceMin: null,
    referenceMax: null,
    flag: null,
    matched: false,
  },
  {
    originalName: 'Glucose Fasting',
    originalValue: 5.5,
    originalUnit: 'mmol/L',
    standardCode: 'GLUCOSE_FASTING',
    standardName: 'Glucose, Fasting',
    standardValue: 99,
    standardUnit: 'mg/dL',
    referenceMin: 70,
    referenceMax: 100,
    flag: 'normal',
    matched: true,
    validationIssues: ['Value near upper limit'],
  },
];

const mockUploadWithData: LabUpload = {
  id: 'upload-1',
  userId: 'user-123',
  filename: 'lab-results.pdf',
  storagePath: 'user-123/upload-1.pdf',
  fileSize: 1024000,
  status: 'complete',
  processingStage: null,
  skipVerification: false,
  extractedData: {
    clientName: 'John Doe',
    clientGender: 'male',
    clientBirthday: '1990-01-15',
    labName: 'Quest Diagnostics',
    orderingDoctor: 'Dr. Smith',
    testDate: '2024-01-01',
    biomarkers: [
      {
        standardCode: 'LDL',
        name: 'LDL Cholesterol',
        value: 120,
        unit: 'mg/dL',
        referenceMin: 0,
        referenceMax: 100,
      },
      {
        standardCode: 'HDL',
        name: 'HDL Cholesterol',
        value: 55,
        unit: 'mg/dL',
        referenceMin: 40,
        referenceMax: 60,
      },
      {
        standardCode: 'GLUCOSE_FASTING',
        name: 'Glucose',
        value: 75,
        unit: 'mg/dL',
        referenceMin: 70,
        referenceMax: 100,
      },
    ],
  },
  extractionConfidence: 0.92,
  verificationPassed: true,
  corrections: ['Fixed LDL unit from g/dL to mg/dL', 'Corrected patient name spelling'],
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00Z',
  startedAt: '2024-01-01T00:00:01Z',
  completedAt: '2024-01-01T00:00:10Z',
  eventId: null,
};

const mockUploadNoData: LabUpload = {
  ...mockUploadWithData,
  id: 'upload-2',
  extractedData: null,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ExtractionPreview', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows no data message when extractedData is null', () => {
    renderWithRouter(
      <ExtractionPreview upload={mockUploadNoData} onClose={mockOnClose} />
    );

    expect(screen.getByText('No extracted data available.')).toBeInTheDocument();
  });

  it('renders modal title', () => {
    renderWithRouter(
      <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
    );

    expect(screen.getByText('Extraction Preview')).toBeInTheDocument();
  });

  describe('Verification Status', () => {
    it('shows verified status when verification passed', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('Verified by GPT')).toBeInTheDocument();
    });

    it('shows unverified status when verification not passed', () => {
      const unverifiedUpload = {
        ...mockUploadWithData,
        verificationPassed: false,
        skipVerification: false,
      };

      renderWithRouter(
        <ExtractionPreview upload={unverifiedUpload} onClose={mockOnClose} />
      );

      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('shows verification skipped when skipped', () => {
      const skippedUpload = {
        ...mockUploadWithData,
        verificationPassed: false,
        skipVerification: true,
      };

      renderWithRouter(
        <ExtractionPreview upload={skippedUpload} onClose={mockOnClose} />
      );

      expect(screen.getByText('Verification skipped')).toBeInTheDocument();
    });

    it('shows confidence percentage', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText(/92% confidence/)).toBeInTheDocument();
    });
  });

  describe('Corrections', () => {
    it('shows corrections when present', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('Corrections Applied')).toBeInTheDocument();
      expect(screen.getByText('Fixed LDL unit from g/dL to mg/dL')).toBeInTheDocument();
      expect(screen.getByText('Corrected patient name spelling')).toBeInTheDocument();
    });

    it('does not show corrections section when none', () => {
      const noCorrectionsUpload = {
        ...mockUploadWithData,
        corrections: null,
      };

      renderWithRouter(
        <ExtractionPreview upload={noCorrectionsUpload} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Corrections Applied')).not.toBeInTheDocument();
    });
  });

  describe('Lab Information', () => {
    it('shows lab name', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('Quest Diagnostics')).toBeInTheDocument();
    });

    it('shows ordering doctor', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    it('shows test date', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });
  });

  describe('Biomarkers Table', () => {
    it('shows biomarker count in tab', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      // Tab button shows biomarker count - use getAllByText since it appears in multiple places
      const biomarkerElements = screen.getAllByText(/Biomarkers \(3\)/);
      expect(biomarkerElements.length).toBeGreaterThan(0);
    });

    it('renders biomarker names', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('LDL Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });

    it('renders biomarker values', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('renders biomarker units', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      // mg/dL appears multiple times
      const units = screen.getAllByText('mg/dL');
      expect(units.length).toBeGreaterThan(0);
    });

    it('shows reference ranges', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('0-100')).toBeInTheDocument();
      expect(screen.getByText('40-60')).toBeInTheDocument();
      expect(screen.getByText('70-100')).toBeInTheDocument();
    });

    it('shows High flag for values above max', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      // LDL is 120, max is 100 -> High
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('shows Normal flag for values in range', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      // HDL is 55, range is 40-60 -> Normal
      // Glucose is 75, range is 70-100 -> Normal
      const normalBadges = screen.getAllByText('Normal');
      expect(normalBadges.length).toBe(2);
    });
  });

  describe('Actions', () => {
    it('calls onClose when Close button clicked', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      // There might be multiple Close buttons - use getAllByRole and click the last one (modal footer)
      const closeButtons = screen.getAllByRole('button', { name: /Close/ });
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows Create Lab Result link when no eventId', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      const createLink = screen.getByRole('link', { name: /Create Lab Result/ });
      expect(createLink).toHaveAttribute(
        'href',
        '/event/new/lab_result?fromUpload=upload-1'
      );
    });

    it('shows View Event link when eventId exists', () => {
      const linkedUpload = {
        ...mockUploadWithData,
        eventId: 'event-123',
      };

      renderWithRouter(
        <ExtractionPreview upload={linkedUpload} onClose={mockOnClose} />
      );

      const viewLink = screen.getByRole('link', { name: /View Event/ });
      expect(viewLink).toHaveAttribute('href', '/event/event-123');
    });
  });

  describe('Biomarker Flag Logic', () => {
    it('uses explicit flag when provided', () => {
      const uploadWithExplicitFlag = {
        ...mockUploadWithData,
        extractedData: {
          ...mockUploadWithData.extractedData!,
          biomarkers: [
            {
              standardCode: 'TEST',
              name: 'Test',
              value: 50,
              unit: 'units',
              flag: 'low' as const,
              referenceMin: 10,
              referenceMax: 100,
            },
          ],
        },
      };

      renderWithRouter(
        <ExtractionPreview upload={uploadWithExplicitFlag} onClose={mockOnClose} />
      );

      // Should show Low even though 50 is in the 10-100 range
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('shows Low for values below min', () => {
      const uploadWithLowValue = {
        ...mockUploadWithData,
        extractedData: {
          ...mockUploadWithData.extractedData!,
          biomarkers: [
            {
              standardCode: 'TEST',
              name: 'Test',
              value: 5,
              unit: 'units',
              referenceMin: 10,
              referenceMax: 100,
            },
          ],
        },
      };

      renderWithRouter(
        <ExtractionPreview upload={uploadWithLowValue} onClose={mockOnClose} />
      );

      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('shows no flag when no reference range', () => {
      const uploadWithNoRange = {
        ...mockUploadWithData,
        extractedData: {
          ...mockUploadWithData.extractedData!,
          biomarkers: [
            {
              standardCode: 'TEST',
              name: 'Test',
              value: 50,
              unit: 'units',
            },
          ],
        },
      };

      renderWithRouter(
        <ExtractionPreview upload={uploadWithNoRange} onClose={mockOnClose} />
      );

      expect(screen.queryByText('High')).not.toBeInTheDocument();
      expect(screen.queryByText('Low')).not.toBeInTheDocument();
      expect(screen.queryByText('Normal')).not.toBeInTheDocument();
    });
  });

  describe('Processed Biomarkers Table', () => {
    const mockUploadWithProcessed: LabUpload = {
      ...mockUploadWithData,
      extractedData: {
        ...mockUploadWithData.extractedData!,
        processedBiomarkers: mockProcessedBiomarkers,
      },
    };

    it('shows processed biomarkers table when processedBiomarkers exist', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      // Should show Status column header (only in processed table)
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('shows matched/unmatched summary counts', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText(/3 matched/)).toBeInTheDocument();
      expect(screen.getByText(/1 unmatched/)).toBeInTheDocument();
    });

    it('shows standard name for matched biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      // HDL shows standard name instead of original
      expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
    });

    it('shows standard name for renamed biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      // HDL was originally "High Density Lipoprotein" but shows as "HDL Cholesterol"
      expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
    });

    it('shows standard code for matched biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('LDL')).toBeInTheDocument();
      expect(screen.getByText('HDL')).toBeInTheDocument();
      expect(screen.getByText('GLUCOSE_FASTING')).toBeInTheDocument();
    });

    it('shows converted value for unit conversions', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      // HDL was converted from 1.42 mmol/L to 55 mg/dL
      expect(screen.getByText('55.0')).toBeInTheDocument();
      expect(screen.getByText(/was 1.42/)).toBeInTheDocument();
    });

    it('shows original name for unmatched biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('Unknown Biomarker XYZ')).toBeInTheDocument();
    });

    it('shows Matched badge for matched biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      const matchedBadges = screen.getAllByText('Matched');
      expect(matchedBadges.length).toBe(3);
    });

    it('shows Unmatched badge for unmatched biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('Unmatched')).toBeInTheDocument();
    });

    it('shows unmatched biomarkers warning notice', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('Unmatched Biomarkers Need Review')).toBeInTheDocument();
      expect(screen.getByText(/1 biomarker could not be matched/)).toBeInTheDocument();
    });

    it('does not show unmatched warning when all biomarkers matched', () => {
      const allMatchedUpload: LabUpload = {
        ...mockUploadWithData,
        extractedData: {
          ...mockUploadWithData.extractedData!,
          processedBiomarkers: mockProcessedBiomarkers.filter((b) => b.matched),
        },
      };

      renderWithRouter(
        <ExtractionPreview upload={allMatchedUpload} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Unmatched Biomarkers Need Review')).not.toBeInTheDocument();
    });

    it('shows flags for processed biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('High')).toBeInTheDocument();
      const normalBadges = screen.getAllByText('Normal');
      expect(normalBadges.length).toBe(2);
    });

    it('shows reference ranges from standards', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithProcessed} onClose={mockOnClose} />
      );

      expect(screen.getByText('0-100')).toBeInTheDocument();
      expect(screen.getByText('40-60')).toBeInTheDocument();
      expect(screen.getByText('70-100')).toBeInTheDocument();
    });
  });

  describe('Raw Biomarkers Table Fallback', () => {
    it('shows raw extraction label when no processedBiomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.getByText('(raw extraction)')).toBeInTheDocument();
    });

    it('does not show Status column for raw biomarkers', () => {
      renderWithRouter(
        <ExtractionPreview upload={mockUploadWithData} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });

    it('shows raw biomarkers when processedBiomarkers is empty array', () => {
      const emptyProcessedUpload: LabUpload = {
        ...mockUploadWithData,
        extractedData: {
          ...mockUploadWithData.extractedData!,
          processedBiomarkers: [],
        },
      };

      renderWithRouter(
        <ExtractionPreview upload={emptyProcessedUpload} onClose={mockOnClose} />
      );

      expect(screen.getByText('(raw extraction)')).toBeInTheDocument();
    });
  });
});
