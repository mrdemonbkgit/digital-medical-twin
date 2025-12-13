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
    <div className={`border rounded-lg p-3 ${skipped ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={skipped ? 'text-theme-muted' : 'text-theme-secondary'}>{icon}</span>
          <span className={`text-sm font-medium ${skipped ? 'text-theme-muted' : 'text-theme-secondary'}`}>{name}</span>
        </div>
        <span className={`text-xs font-mono ${skipped ? 'text-theme-muted' : 'text-theme-tertiary'}`}>
          {skipped ? 'Skipped' : isInstant ? 'instant' : formatDuration(durationMs!)}
        </span>
      </div>

      {/* Progress bar - hide for skipped or instant operations */}
      {!skipped && !isInstant && (
        <div className="h-2 bg-theme-tertiary rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Details */}
      <div className={`text-xs ${skipped ? 'text-theme-muted' : 'text-theme-tertiary'}`}>
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
      <h4 className="text-sm font-medium text-theme-secondary">Processing Timeline</h4>

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
                    Pages: <span className="text-success">{stage2.pagesPassed}</span>
                    {stage2.pagesFailed !== undefined && stage2.pagesFailed > 0 && (
                      <>/<span className="text-warning">{stage2.pagesFailed}</span></>
                    )} of {stage2.pagesVerified}
                  </span>
                ) : (
                  <span>
                    {stage2.verificationPassed ? (
                      <span className="text-success">Passed</span>
                    ) : (
                      <span className="text-danger">Failed</span>
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
                  <span className="text-warning">
                    {mergeStage.duplicatesRemoved} duplicate{mergeStage.duplicatesRemoved !== 1 ? 's' : ''} removed
                  </span>
                )}
                {mergeStage.conflictsResolved > 0 && (
                  <span className="text-info">
                    {mergeStage.conflictsResolved} conflict{mergeStage.conflictsResolved !== 1 ? 's' : ''} resolved
                  </span>
                )}
              </div>
            }
          />
        )}

        {/* Stage 3: Biomarker Matching & Conversion - Verbose */}
        <StageCard
          name={stage3.name}
          icon={<Link2 className="h-4 w-4" />}
          durationMs={stage3.durationMs}
          totalMs={totalDurationMs}
          details={
            <div className="space-y-2">
              {/* Summary row */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>Standards: {stage3.standardsCount}</span>
                <span>Gender: {stage3.userGender}</span>
                <span>
                  Matched: <span className="text-success">{stage3.matchedCount}</span>
                  {stage3.unmatchedCount > 0 && (
                    <> / Unmatched: <span className="text-warning">{stage3.unmatchedCount}</span></>
                  )}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-info-muted text-accent font-medium">
                  {stage3.conversionMethod}
                </span>
              </div>

              {/* Matched biomarkers list */}
              {stage3.matchDetails.filter(d => d.matchedCode).length > 0 && (
                <div className="pt-1 border-t border-theme-primary">
                  <div className="text-xs text-success font-medium mb-1">
                    ✓ Matched ({stage3.matchedCount}):
                  </div>
                  <div className="space-y-0.5 text-xs">
                    {stage3.matchDetails
                      .filter(d => d.matchedCode)
                      .map((d, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-theme-secondary">{d.originalName}</span>
                          <span className="text-theme-muted">→</span>
                          <span className="font-mono text-theme-secondary">{d.matchedCode}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Conversions applied list */}
              {stage3.matchDetails.filter(d => d.conversionApplied).length > 0 && (
                <div className="pt-1 border-t border-theme-primary">
                  <div className="text-xs text-info font-medium mb-1">
                    ↔ Conversions ({stage3.conversionsApplied}):
                  </div>
                  <div className="space-y-0.5 font-mono text-xs">
                    {stage3.matchDetails
                      .filter(d => d.conversionApplied)
                      .map((d, i) => (
                        <div key={i}>
                          {d.originalName}: {d.conversionApplied!.fromValue} {d.conversionApplied!.fromUnit}
                          {' → '}{d.conversionApplied!.toValue.toFixed(2)} {d.conversionApplied!.toUnit}
                          {' '}(×{d.conversionApplied!.factor})
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Missing conversions */}
              {stage3.matchDetails.filter(d => d.conversionMissing).length > 0 && (
                <div className="pt-1 border-t border-theme-primary">
                  <div className="text-xs text-orange-600 font-medium mb-1">
                    ⚠ Missing Conversions ({stage3.conversionsMissing}):
                  </div>
                  <div className="space-y-0.5 font-mono text-xs text-orange-700">
                    {stage3.matchDetails
                      .filter(d => d.conversionMissing)
                      .map((d, i) => (
                        <div key={i}>
                          {d.originalName}: {d.conversionMissing!.fromUnit} → {d.conversionMissing!.toUnit}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Unmatched biomarkers */}
              {stage3.matchDetails.filter(d => !d.matchedCode).length > 0 && (
                <div className="pt-1 border-t border-theme-primary">
                  <div className="text-xs text-warning font-medium mb-1">
                    ✗ Unmatched ({stage3.unmatchedCount}):
                  </div>
                  <div className="space-y-0.5 text-xs text-warning">
                    {stage3.matchDetails
                      .filter(d => !d.matchedCode)
                      .map((d, i) => (
                        <div key={i}>{d.originalName}</div>
                      ))}
                  </div>
                </div>
              )}

              {/* Validation issues */}
              {stage3.matchDetails.some(d => d.validationIssues?.length > 0) && (
                <div className="pt-1 border-t border-theme-primary">
                  <div className="text-xs text-danger font-medium mb-1">
                    ⚠ Validation Issues:
                  </div>
                  <div className="space-y-0.5 text-xs text-danger">
                    {stage3.matchDetails
                      .filter(d => d.validationIssues?.length > 0)
                      .map((d, i) => (
                        <div key={i}>
                          {d.originalName}: {d.validationIssues.join(', ')}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
