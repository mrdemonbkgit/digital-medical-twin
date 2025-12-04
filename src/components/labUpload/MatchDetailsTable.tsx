import { Link2, Link2Off, AlertTriangle, ArrowRight } from 'lucide-react';
import type { BiomarkerMatchDetail } from '@/types';

interface MatchDetailsTableProps {
  matchDetails: BiomarkerMatchDetail[];
}

function MatchDetailRow({ detail }: { detail: BiomarkerMatchDetail }) {
  const hasConversion = detail.conversionApplied !== undefined;
  const hasIssues = detail.validationIssues.length > 0;

  return (
    <tr className={`hover:bg-gray-50 ${!detail.matchedCode ? 'bg-amber-50/50' : ''}`}>
      {/* Original Name */}
      <td className="px-2 py-2 text-sm text-gray-900 truncate" title={detail.originalName}>
        {detail.originalName}
      </td>

      {/* Matched To */}
      <td className="px-2 py-2">
        {detail.matchedCode ? (
          <div>
            <div className="text-sm text-gray-900 truncate" title={detail.matchedName || ''}>
              {detail.matchedName}
            </div>
            <div className="text-xs text-gray-400 font-mono truncate">{detail.matchedCode}</div>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-amber-600">
            <Link2Off className="h-3 w-3" />
            No match
          </span>
        )}
      </td>

      {/* Conversion */}
      <td className="px-2 py-2 text-xs text-gray-500">
        {hasConversion ? (
          <div className="flex items-center gap-1 font-mono">
            <span>{detail.conversionApplied!.fromValue} {detail.conversionApplied!.fromUnit}</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span className="text-gray-900">{detail.conversionApplied!.toValue.toFixed(2)} {detail.conversionApplied!.toUnit}</span>
          </div>
        ) : detail.matchedCode ? (
          <span className="text-gray-400">No conversion</span>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>

      {/* Issues */}
      <td className="px-2 py-2">
        {hasIssues ? (
          <div className="flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-600">
              {detail.validationIssues.join(', ')}
            </div>
          </div>
        ) : (
          <span className="text-gray-300 text-xs">-</span>
        )}
      </td>
    </tr>
  );
}

export function MatchDetailsTable({ matchDetails }: MatchDetailsTableProps) {
  const matched = matchDetails.filter((d) => d.matchedCode);
  const unmatched = matchDetails.filter((d) => !d.matchedCode);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Biomarker Matching Details</h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600">
            <Link2 className="h-3 w-3 inline mr-1" />
            {matched.length} matched
          </span>
          {unmatched.length > 0 && (
            <span className="text-amber-600">
              <Link2Off className="h-3 w-3 inline mr-1" />
              {unmatched.length} unmatched
            </span>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[500px] table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[25%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Original Name
              </th>
              <th className="w-[25%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Matched To
              </th>
              <th className="w-[28%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Conversion
              </th>
              <th className="w-[22%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Issues
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matchDetails.map((detail, index) => (
              <MatchDetailRow key={index} detail={detail} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
