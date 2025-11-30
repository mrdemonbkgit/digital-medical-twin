import { Sparkles, ShieldCheck, Link2, GitMerge } from 'lucide-react';
import type { ExtractionDebugInfo } from '@/types';

interface StageTimelineProps {
  debugInfo: ExtractionDebugInfo;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface StageCardProps {
  name: string;
  icon: React.ReactNode;
  durationMs?: number; // Optional - omit for instant operations like merge
  totalMs: number;
  details: React.ReactNode;
  skipped?: boolean;
}

function StageCard({ name, icon, durationMs, totalMs, details, skipped }: StageCardProps) {
  const percentage = totalMs > 0 && durationMs ? Math.round((durationMs / totalMs) * 100) : 0;
  const isInstant = durationMs === undefined || durationMs === 0;

  return (
    <div className={`border rounded-lg p-3 ${skipped ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={skipped ? 'text-gray-400' : 'text-gray-600'}>{icon}</span>
          <span className={`text-sm font-medium ${skipped ? 'text-gray-400' : 'text-gray-700'}`}>{name}</span>
        </div>
        <span className={`text-xs font-mono ${skipped ? 'text-gray-400' : 'text-gray-500'}`}>
          {skipped ? 'Skipped' : isInstant ? 'instant' : formatDuration(durationMs!)}
        </span>
      </div>

      {/* Progress bar - hide for skipped or instant operations */}
      {!skipped && !isInstant && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Details */}
      <div className={`text-xs ${skipped ? 'text-gray-400' : 'text-gray-500'}`}>
        {details}
      </div>
    </div>
  );
}

export function StageTimeline({ debugInfo }: StageTimelineProps) {
  const { stage1, stage2, stage3, totalDurationMs, mergeStage } = debugInfo;
  const isChunked = debugInfo.isChunked ?? false;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Processing Timeline</h4>

      <div className="space-y-2">
        {/* Stage 1: Gemini Extraction */}
        <StageCard
          name={stage1.name}
          icon={<Sparkles className="h-4 w-4" />}
          durationMs={stage1.durationMs}
          totalMs={totalDurationMs}
          details={
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>Model: <span className="font-mono">{stage1.model}</span></span>
              <span>Thinking: {stage1.thinkingLevel}</span>
              <span>Extracted: {stage1.biomarkersExtracted} biomarkers</span>
              {isChunked && stage1.pagesProcessed && (
                <>
                  <span>Pages: {stage1.pagesProcessed}</span>
                  {stage1.avgPageDurationMs && (
                    <span>Avg: {formatDuration(stage1.avgPageDurationMs)}/page</span>
                  )}
                </>
              )}
            </div>
          }
        />

        {/* Stage 2: GPT Verification */}
        <StageCard
          name={stage2.name}
          icon={<ShieldCheck className="h-4 w-4" />}
          durationMs={stage2.durationMs || 0}
          totalMs={totalDurationMs}
          skipped={stage2.skipped}
          details={
            stage2.skipped ? (
              <span>Verification was skipped by user preference</span>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>Model: <span className="font-mono">{stage2.model}</span></span>
                <span>Reasoning: {stage2.reasoningEffort}</span>
                {isChunked && stage2.pagesVerified ? (
                  <span>
                    Pages: <span className="text-green-600">{stage2.pagesPassed}</span>
                    {stage2.pagesFailed !== undefined && stage2.pagesFailed > 0 && (
                      <>/<span className="text-amber-600">{stage2.pagesFailed}</span></>
                    )} of {stage2.pagesVerified}
                  </span>
                ) : (
                  <span>
                    {stage2.verificationPassed ? (
                      <span className="text-green-600">Passed</span>
                    ) : (
                      <span className="text-red-600">Failed</span>
                    )}
                  </span>
                )}
                {stage2.correctionsCount > 0 && (
                  <span>{stage2.correctionsCount} correction{stage2.correctionsCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            )
          }
        />

        {/* Merge Stage (only for chunked extraction) - instant operation, omit durationMs */}
        {isChunked && mergeStage && (
          <StageCard
            name={mergeStage.name}
            icon={<GitMerge className="h-4 w-4" />}
            totalMs={totalDurationMs}
            details={
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  {mergeStage.totalBiomarkersBeforeMerge} → {mergeStage.totalBiomarkersAfterMerge} biomarkers
                </span>
                {mergeStage.duplicatesRemoved > 0 && (
                  <span className="text-amber-600">
                    {mergeStage.duplicatesRemoved} duplicate{mergeStage.duplicatesRemoved !== 1 ? 's' : ''} removed
                  </span>
                )}
                {mergeStage.conflictsResolved > 0 && (
                  <span className="text-blue-600">
                    {mergeStage.conflictsResolved} conflict{mergeStage.conflictsResolved !== 1 ? 's' : ''} resolved
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Stage 3: Biomarker Matching */}
        <StageCard
          name={stage3.name}
          icon={<Link2 className="h-4 w-4" />}
          durationMs={stage3.durationMs}
          totalMs={totalDurationMs}
          details={
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>Standards: {stage3.standardsCount}</span>
              <span>Gender: {stage3.userGender}</span>
              <span>
                Matched: <span className="text-green-600">{stage3.matchedCount}</span>
                {stage3.unmatchedCount > 0 && (
                  <> / Unmatched: <span className="text-amber-600">{stage3.unmatchedCount}</span></>
                )}
              </span>
            </div>
          }
        />
      </div>
    </div>
  );
}
