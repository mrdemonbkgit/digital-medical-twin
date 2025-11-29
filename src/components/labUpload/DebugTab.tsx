import { Bug } from 'lucide-react';
import type { ExtractionDebugInfo } from '@/types';
import { DebugSummary } from './DebugSummary';
import { StageTimeline } from './StageTimeline';
import { MatchDetailsTable } from './MatchDetailsTable';
import { RawResponseSection } from './RawResponseSection';

interface DebugTabProps {
  debugInfo?: ExtractionDebugInfo;
}

export function DebugTab({ debugInfo }: DebugTabProps) {
  if (!debugInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Bug className="h-8 w-8 mb-3 text-gray-400" />
        <p className="text-sm">No debug information available for this extraction.</p>
        <p className="text-xs text-gray-400 mt-1">
          Debug info is only captured for extractions run after this feature was added.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <DebugSummary debugInfo={debugInfo} />

      {/* Stage Timeline */}
      <StageTimeline debugInfo={debugInfo} />

      {/* Match Details Table */}
      {debugInfo.stage3.matchDetails.length > 0 && (
        <MatchDetailsTable matchDetails={debugInfo.stage3.matchDetails} />
      )}

      {/* Raw Responses (collapsible) */}
      <RawResponseSection debugInfo={debugInfo} />
    </div>
  );
}
