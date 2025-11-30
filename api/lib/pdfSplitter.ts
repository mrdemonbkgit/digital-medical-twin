import { PDFDocument } from 'pdf-lib';

export interface PageChunk {
  pageNumber: number;
  base64: string;
  byteSize: number;
}

/**
 * Get the page count of a PDF from its base64 content
 */
export async function getPageCount(pdfBase64: string): Promise<number> {
  const pdfBytes = Buffer.from(pdfBase64, 'base64');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  return pdfDoc.getPageCount();
}

/**
 * Split a PDF into individual pages, returning each as a separate base64 PDF
 */
export async function splitPdfIntoPages(pdfBase64: string): Promise<PageChunk[]> {
  const pdfBytes = Buffer.from(pdfBase64, 'base64');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  const chunks: PageChunk[] = [];

  for (let i = 0; i < pageCount; i++) {
    // Create a new PDF document with just this page
    const singlePageDoc = await PDFDocument.create();
    const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
    singlePageDoc.addPage(copiedPage);

    // Convert to bytes and then base64
    const pageBytes = await singlePageDoc.save();
    const pageBase64 = Buffer.from(pageBytes).toString('base64');

    chunks.push({
      pageNumber: i + 1, // 1-indexed for display
      base64: pageBase64,
      byteSize: pageBytes.length,
    });
  }

  return chunks;
}

/**
 * Extract a range of pages from a PDF
 *
 * @future Planned for batch processing optimization - extract page ranges
 * instead of single pages for medium-sized PDFs (e.g., process pages 1-3
 * as one chunk instead of 3 separate API calls)
 */
export async function extractPageRange(
  pdfBase64: string,
  startPage: number, // 1-indexed
  endPage: number // 1-indexed, inclusive
): Promise<PageChunk> {
  const pdfBytes = Buffer.from(pdfBase64, 'base64');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  // Validate page range
  const start = Math.max(1, startPage);
  const end = Math.min(pageCount, endPage);

  // Create indices array (0-indexed)
  const pageIndices = [];
  for (let i = start - 1; i < end; i++) {
    pageIndices.push(i);
  }

  // Create a new PDF with the selected pages
  const rangeDoc = await PDFDocument.create();
  const copiedPages = await rangeDoc.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach((page) => rangeDoc.addPage(page));

  const rangeBytes = await rangeDoc.save();
  const rangeBase64 = Buffer.from(rangeBytes).toString('base64');

  return {
    pageNumber: start, // Use start page as identifier
    base64: rangeBase64,
    byteSize: rangeBytes.length,
  };
}
