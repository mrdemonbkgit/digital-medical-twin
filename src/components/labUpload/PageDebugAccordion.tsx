import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { PageDebugInfo } from '@/types';

interface PageDebugAccordionProps {
  pageDetails: PageDebugInfo[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface PageRowProps {
  page: PageDebugInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

function PageRow({ page, isExpanded, onToggle }: PageRowProps) {
  const totalDuration =
    page.extraction.durationMs + (page.verification?.durationMs || 0);
  const hasVerification = !!page.verification;
  const verificationPassed = page.verification?.verificationPassed ?? false;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Page {page.pageNumber}
          </span>
          <span className="text-xs text-gray-500">
            {page.extraction.biomarkersExtracted} biomarker
            {page.extraction.biomarkersExtracted !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">
            {formatDuration(totalDuration)}
          </span>
          {hasVerification && (
            verificationPassed ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-amber-500" />
            )
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-3">
          {/* Extraction */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Extraction
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {formatDuration(page.extraction.durationMs)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Extracted {page.extraction.biomarkersExtracted} biomarker
                {page.extraction.biomarkersExtracted !== 1 ? 's' : ''}
                {page.extraction.biomarkersExtracted === 0 && ' (empty page)'}
              </p>
            </div>
          </div>

          {/* Verification */}
          {page.verification && (
            <div className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${
                  page.verification.verificationPassed
                    ? 'bg-green-500'
                    : 'bg-amber-500'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    Verification
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    {formatDuration(page.verification.durationMs)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {page.verification.verificationPassed ? (
                    <span className="text-green-600">Passed</span>
                  ) : (
                    <span className="text-amber-600">
                      Issues found
                    </span>
                  )}
                  {page.verification.correctionsCount > 0 && (
                    <span className="ml-1">
                      ({page.verification.correctionsCount} correction
                      {page.verification.correctionsCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
                {/* Corrections list */}
                {page.verification.corrections.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {page.verification.corrections.map((correction, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-amber-600 pl-2 border-l-2 border-amber-300"
                      >
                        {correction}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PageDebugAccordion({ pageDetails }: PageDebugAccordionProps) {
  const [expandedPage, setExpandedPage] = useState<number | null>(null);

  const togglePage = (pageNumber: number) => {
    setExpandedPage(expandedPage === pageNumber ? null : pageNumber);
  };

  if (!pageDetails || pageDetails.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Per-Page Details</h4>
      <div className="space-y-2">
        {pageDetails.map((page) => (
          <PageRow
            key={page.pageNumber}
            page={page}
            isExpanded={expandedPage === page.pageNumber}
            onToggle={() => togglePage(page.pageNumber)}
          />
        ))}
      </div>
    </div>
  );
}
