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
    <div className="border border-theme-primary rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-theme-primary hover:bg-theme-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-theme-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-theme-muted" />
          )}
          <FileText className="h-4 w-4 text-theme-tertiary" />
          <span className="text-sm font-medium text-theme-secondary">
            Page {page.pageNumber}
          </span>
          <span className="text-xs text-theme-tertiary">
            {page.extraction.biomarkersExtracted} biomarker
            {page.extraction.biomarkersExtracted !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-theme-tertiary">
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
        <div className="border-t border-theme-primary bg-theme-secondary p-3 space-y-3">
          {/* Extraction */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-theme-secondary">
                  Extraction
                </span>
                <span className="text-xs font-mono text-theme-tertiary">
                  {formatDuration(page.extraction.durationMs)}
                </span>
              </div>
              <p className="text-xs text-theme-tertiary mt-1">
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
                  <span className="text-xs font-medium text-theme-secondary">
                    Verification
                  </span>
                  <span className="text-xs font-mono text-theme-tertiary">
                    {formatDuration(page.verification.durationMs)}
                  </span>
                </div>
                <p className="text-xs text-theme-tertiary mt-1">
                  {page.verification.verificationPassed ? (
                    <span className="text-success">Passed</span>
                  ) : (
                    <span className="text-warning">
                      Issues found
                      {page.verification.correctionsCount > 0 && (
                        <span className="ml-1">
                          ({page.verification.correctionsCount} correction
                          {page.verification.correctionsCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                  )}
                </p>
                {/* Corrections list */}
                {!page.verification.verificationPassed && (
                  <ul className="mt-2 space-y-1">
                    {page.verification.corrections.length > 0 ? (
                      page.verification.corrections.map((correction, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-warning pl-2 border-l-2 border-amber-300"
                        >
                          {correction}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-theme-tertiary pl-2 border-l-2 border-theme-primary italic">
                        Verification flagged issues but no specific corrections provided
                      </li>
                    )}
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
      <h4 className="text-sm font-medium text-theme-secondary">Per-Page Details</h4>
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
