import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPageCount, splitPdfIntoPages, extractPageRange, type PageChunk } from './pdfSplitter';

// Mock pdf-lib
const mockGetPageCount = vi.fn();
const mockCopyPages = vi.fn();
const mockAddPage = vi.fn();
const mockSave = vi.fn();

const mockPdfDoc = {
  getPageCount: mockGetPageCount,
  copyPages: mockCopyPages,
};

const mockNewPdfDoc = {
  copyPages: mockCopyPages,
  addPage: mockAddPage,
  save: mockSave,
};

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: () => mockGetPageCount(),
      copyPages: (...args: unknown[]) => mockCopyPages(...args),
    }),
    create: vi.fn().mockResolvedValue({
      copyPages: (...args: unknown[]) => mockCopyPages(...args),
      addPage: (...args: unknown[]) => mockAddPage(...args),
      save: () => mockSave(),
    }),
  },
}));

// Sample base64 encoded "PDF" (not a real PDF, just for testing)
const sampleBase64 = Buffer.from('fake pdf content').toString('base64');

describe('pdfSplitter', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetPageCount.mockReturnValue(3);
    mockCopyPages.mockResolvedValue([{ fake: 'page' }]);
    mockSave.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]));
  });

  describe('getPageCount', () => {
    it('returns page count for a PDF', async () => {
      mockGetPageCount.mockReturnValue(5);

      const count = await getPageCount(sampleBase64);

      expect(count).toBe(5);
    });

    it('returns 1 for single page PDF', async () => {
      mockGetPageCount.mockReturnValue(1);

      const count = await getPageCount(sampleBase64);

      expect(count).toBe(1);
    });

    it('returns 0 for empty PDF', async () => {
      mockGetPageCount.mockReturnValue(0);

      const count = await getPageCount(sampleBase64);

      expect(count).toBe(0);
    });

    it('handles large page counts', async () => {
      mockGetPageCount.mockReturnValue(100);

      const count = await getPageCount(sampleBase64);

      expect(count).toBe(100);
    });
  });

  describe('splitPdfIntoPages', () => {
    it('splits multi-page PDF into individual pages', async () => {
      mockGetPageCount.mockReturnValue(3);

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].pageNumber).toBe(1);
      expect(chunks[1].pageNumber).toBe(2);
      expect(chunks[2].pageNumber).toBe(3);
    });

    it('returns base64 encoded pages', async () => {
      mockGetPageCount.mockReturnValue(2);
      mockSave.mockResolvedValue(new Uint8Array([65, 66, 67])); // "ABC"

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks[0].base64).toBe(Buffer.from([65, 66, 67]).toString('base64'));
    });

    it('includes byte size for each page', async () => {
      mockGetPageCount.mockReturnValue(1);
      mockSave.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]));

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks[0].byteSize).toBe(5);
    });

    it('handles single page PDF', async () => {
      mockGetPageCount.mockReturnValue(1);

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].pageNumber).toBe(1);
    });

    it('returns empty array for empty PDF', async () => {
      mockGetPageCount.mockReturnValue(0);

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks).toHaveLength(0);
    });

    it('uses 1-indexed page numbers', async () => {
      mockGetPageCount.mockReturnValue(5);

      const chunks = await splitPdfIntoPages(sampleBase64);

      expect(chunks.map((c) => c.pageNumber)).toEqual([1, 2, 3, 4, 5]);
    });

    it('calls copyPages for each page with correct index', async () => {
      mockGetPageCount.mockReturnValue(3);

      await splitPdfIntoPages(sampleBase64);

      // Should be called 3 times (once per page)
      expect(mockCopyPages).toHaveBeenCalledTimes(3);
    });
  });

  describe('extractPageRange', () => {
    it('extracts a range of pages', async () => {
      mockGetPageCount.mockReturnValue(10);
      mockCopyPages.mockResolvedValue([{ page: 1 }, { page: 2 }, { page: 3 }]);

      const chunk = await extractPageRange(sampleBase64, 2, 4);

      expect(chunk.pageNumber).toBe(2); // Start page as identifier
    });

    it('returns base64 encoded range', async () => {
      mockGetPageCount.mockReturnValue(5);
      mockSave.mockResolvedValue(new Uint8Array([10, 20, 30]));

      const chunk = await extractPageRange(sampleBase64, 1, 3);

      expect(chunk.base64).toBe(Buffer.from([10, 20, 30]).toString('base64'));
    });

    it('includes byte size', async () => {
      mockGetPageCount.mockReturnValue(5);
      mockSave.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7]));

      const chunk = await extractPageRange(sampleBase64, 1, 2);

      expect(chunk.byteSize).toBe(7);
    });

    it('clamps start page to minimum of 1', async () => {
      mockGetPageCount.mockReturnValue(5);

      const chunk = await extractPageRange(sampleBase64, -5, 3);

      expect(chunk.pageNumber).toBe(1); // Clamped to 1
    });

    it('clamps end page to page count', async () => {
      mockGetPageCount.mockReturnValue(5);

      // Request pages 3-100, but PDF only has 5 pages
      await extractPageRange(sampleBase64, 3, 100);

      // Should only copy pages 3, 4, 5 (indices 2, 3, 4)
      expect(mockCopyPages).toHaveBeenCalledWith(expect.anything(), [2, 3, 4]);
    });

    it('handles single page range', async () => {
      mockGetPageCount.mockReturnValue(10);
      mockCopyPages.mockResolvedValue([{ page: 5 }]);

      const chunk = await extractPageRange(sampleBase64, 5, 5);

      expect(chunk.pageNumber).toBe(5);
      // Should copy only one page (index 4)
      expect(mockCopyPages).toHaveBeenCalledWith(expect.anything(), [4]);
    });

    it('handles full document range', async () => {
      mockGetPageCount.mockReturnValue(3);
      mockCopyPages.mockResolvedValue([{ page: 1 }, { page: 2 }, { page: 3 }]);

      const chunk = await extractPageRange(sampleBase64, 1, 3);

      expect(chunk.pageNumber).toBe(1);
      expect(mockCopyPages).toHaveBeenCalledWith(expect.anything(), [0, 1, 2]);
    });

    it('adds all copied pages to new document', async () => {
      mockGetPageCount.mockReturnValue(5);
      const mockPages = [{ id: 1 }, { id: 2 }];
      mockCopyPages.mockResolvedValue(mockPages);

      await extractPageRange(sampleBase64, 2, 3);

      expect(mockAddPage).toHaveBeenCalledTimes(2);
    });
  });

  describe('PageChunk interface', () => {
    it('returns correct shape from splitPdfIntoPages', async () => {
      mockGetPageCount.mockReturnValue(1);
      mockSave.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const chunks = await splitPdfIntoPages(sampleBase64);
      const chunk: PageChunk = chunks[0];

      expect(chunk).toHaveProperty('pageNumber');
      expect(chunk).toHaveProperty('base64');
      expect(chunk).toHaveProperty('byteSize');
      expect(typeof chunk.pageNumber).toBe('number');
      expect(typeof chunk.base64).toBe('string');
      expect(typeof chunk.byteSize).toBe('number');
    });

    it('returns correct shape from extractPageRange', async () => {
      mockGetPageCount.mockReturnValue(5);
      mockSave.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const chunk: PageChunk = await extractPageRange(sampleBase64, 1, 2);

      expect(chunk).toHaveProperty('pageNumber');
      expect(chunk).toHaveProperty('base64');
      expect(chunk).toHaveProperty('byteSize');
    });
  });
});
