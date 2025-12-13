import { Clock, FileText, FlaskConical, CheckCircle, XCircle, Layers, GitMerge } from 'lucide-react';
import type { ExtractionDebugInfo } from '@/types';

interface DebugSummaryProps {
  debugInfo: ExtractionDebugInfo;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DebugSummary({ debugInfo }: DebugSummaryProps) {
  const { stage1, stage2, stage3 } = debugInfo;
  const isChunked = debugInfo.isChunked ?? false;
  const pageCount = debugInfo.pageCount ?? 1;
  const totalBiomarkers = stage1.biomarkersExtracted;
  const matchedCount = stage3.matchedCount;
  const unmatchedCount = stage3.unmatchedCount;
  const matchRate = totalBiomarkers > 0 ? Math.round((matchedCount / totalBiomarkers) * 100) : 0;

  return (
    <div className="bg-theme-secondary border border-theme-primary rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-theme-secondary">Extraction Summary</h4>
        {isChunked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-info-muted text-accent">
            <Layers className="h-3 w-3" />
            Chunked: {pageCount} pages
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {/* Total Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-theme-muted" />
          <div>
            <div className="text-theme-tertiary text-xs">Total Time</div>
            <div className="font-medium text-theme-primary">{formatDuration(debugInfo.totalDurationMs)}</div>
          </div>
        </div>

        {/* PDF Size */}
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-theme-muted" />
          <div>
            <div className="text-theme-tertiary text-xs">PDF Size</div>
            <div className="font-medium text-theme-primary">{formatBytes(debugInfo.pdfSizeBytes)}</div>
          </div>
        </div>

        {/* Biomarkers */}
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-theme-muted" />
          <div>
            <div className="text-theme-tertiary text-xs">Biomarkers</div>
            <div className="font-medium text-theme-primary">
              {totalBiomarkers}
              {totalBiomarkers > 0 && (
                <span className="text-xs text-theme-tertiary ml-1">
                  ({matchedCount}/{unmatchedCount > 0 ? `${matchedCount + unmatchedCount}` : matchedCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className="flex items-center gap-2">
          {stage2.skipped ? (
            <XCircle className="h-4 w-4 text-theme-muted" />
          ) : stage2.verificationPassed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <div>
            <div className="text-theme-tertiary text-xs">Verification</div>
            <div className="font-medium text-theme-primary">
              {stage2.skipped ? 'Skipped' : stage2.verificationPassed ? 'Passed' : 'Failed'}
              {!stage2.skipped && stage2.correctionsCount > 0 && (
                <span className="text-xs text-theme-tertiary ml-1">
                  ({stage2.correctionsCount} fix{stage2.correctionsCount !== 1 ? 'es' : ''})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match rate bar */}
      {totalBiomarkers > 0 && (
        <div className="mt-4 pt-3 border-t border-theme-primary">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-theme-tertiary">Match Rate</span>
            <span className="font-medium text-theme-secondary">{matchRate}%</span>
          </div>
          <div className="h-2 bg-theme-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${matchRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Merge stats (only for chunked extraction) */}
      {isChunked && debugInfo.mergeStage && (
        <div className="mt-4 pt-3 border-t border-theme-primary">
          <div className="flex items-center gap-2 text-xs">
            <GitMerge className="h-3.5 w-3.5 text-theme-muted" />
            <span className="text-theme-tertiary">Merge:</span>
            <span className="font-medium text-theme-secondary">
              {debugInfo.mergeStage.totalBiomarkersBeforeMerge} biomarkers merged to {debugInfo.mergeStage.totalBiomarkersAfterMerge}
            </span>
            {debugInfo.mergeStage.duplicatesRemoved > 0 && (
              <span className="text-warning">
                ({debugInfo.mergeStage.duplicatesRemoved} duplicate{debugInfo.mergeStage.duplicatesRemoved !== 1 ? 's' : ''} removed)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
