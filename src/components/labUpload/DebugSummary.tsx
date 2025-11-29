import { Clock, FileText, FlaskConical, CheckCircle, XCircle } from 'lucide-react';
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
  const totalBiomarkers = stage1.biomarkersExtracted;
  const matchedCount = stage3.matchedCount;
  const unmatchedCount = stage3.unmatchedCount;
  const matchRate = totalBiomarkers > 0 ? Math.round((matchedCount / totalBiomarkers) * 100) : 0;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Extraction Summary</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {/* Total Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-gray-500 text-xs">Total Time</div>
            <div className="font-medium text-gray-900">{formatDuration(debugInfo.totalDurationMs)}</div>
          </div>
        </div>

        {/* PDF Size */}
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-gray-500 text-xs">PDF Size</div>
            <div className="font-medium text-gray-900">{formatBytes(debugInfo.pdfSizeBytes)}</div>
          </div>
        </div>

        {/* Biomarkers */}
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-gray-500 text-xs">Biomarkers</div>
            <div className="font-medium text-gray-900">
              {totalBiomarkers}
              {totalBiomarkers > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({matchedCount}/{unmatchedCount > 0 ? `${matchedCount + unmatchedCount}` : matchedCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className="flex items-center gap-2">
          {stage2.skipped ? (
            <XCircle className="h-4 w-4 text-gray-400" />
          ) : stage2.verificationPassed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <div>
            <div className="text-gray-500 text-xs">Verification</div>
            <div className="font-medium text-gray-900">
              {stage2.skipped ? 'Skipped' : stage2.verificationPassed ? 'Passed' : 'Failed'}
              {!stage2.skipped && stage2.correctionsCount > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({stage2.correctionsCount} fix{stage2.correctionsCount !== 1 ? 'es' : ''})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match rate bar */}
      {totalBiomarkers > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Match Rate</span>
            <span className="font-medium text-gray-700">{matchRate}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${matchRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
