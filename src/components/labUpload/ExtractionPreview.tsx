import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Calendar,
  CheckCircle,
  AlertCircle,
  FlaskConical,
  Plus,
  ExternalLink,
  Link2,
  Link2Off,
  Bug,
} from 'lucide-react';
import { Modal, Button } from '@/components/common';
import type { LabUpload, Biomarker, ProcessedBiomarker } from '@/types';
import { DebugTab } from './DebugTab';

interface ExtractionPreviewProps {
  upload: LabUpload;
  onClose: () => void;
}

function getBiomarkerFlag(biomarker: Biomarker): 'high' | 'low' | 'normal' | null {
  if (biomarker.flag) return biomarker.flag;
  if (biomarker.referenceMin !== undefined && biomarker.value < biomarker.referenceMin) return 'low';
  if (biomarker.referenceMax !== undefined && biomarker.value > biomarker.referenceMax) return 'high';
  if (biomarker.referenceMin !== undefined || biomarker.referenceMax !== undefined) return 'normal';
  return null;
}

function FlagBadge({ flag }: { flag: 'high' | 'low' | 'normal' | null }) {
  if (!flag) return null;

  const colors = {
    high: 'bg-red-100 text-red-700',
    low: 'bg-blue-100 text-blue-700',
    normal: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[flag]}`}>
      {flag.charAt(0).toUpperCase() + flag.slice(1)}
    </span>
  );
}

function MatchBadge({ matched }: { matched: boolean }) {
  return matched ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
      <Link2 className="h-3 w-3" />
      Matched
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
      <Link2Off className="h-3 w-3" />
      Unmatched
    </span>
  );
}

function ProcessedBiomarkerRow({ biomarker }: { biomarker: ProcessedBiomarker }) {
  return (
    <tr className={`hover:bg-gray-50 ${!biomarker.matched ? 'bg-amber-50/50' : ''}`}>
      {/* Name column with original and standard names */}
      <td className="px-2 py-2">
        <div className="text-sm text-gray-900 truncate" title={biomarker.matched ? biomarker.standardName || '' : biomarker.originalName}>
          {biomarker.matched ? biomarker.standardName : biomarker.originalName}
        </div>
        {biomarker.standardCode && (
          <div className="text-xs text-gray-400 font-mono truncate">
            {biomarker.standardCode}
          </div>
        )}
      </td>

      {/* Value column with original and standardized */}
      <td className="px-2 py-2 text-right">
        <div className="text-sm text-gray-900 font-mono">
          {biomarker.matched && biomarker.standardValue !== null
            ? biomarker.standardValue.toFixed(1)
            : biomarker.originalValue}
        </div>
        {biomarker.matched &&
          biomarker.standardValue !== null &&
          biomarker.standardValue !== biomarker.originalValue && (
            <div className="text-xs text-gray-500 truncate" title={`Original: ${biomarker.originalValue} ${biomarker.originalUnit}`}>
              was {biomarker.originalValue}
            </div>
          )}
      </td>

      {/* Unit column */}
      <td className="px-2 py-2 text-sm text-gray-500 truncate">
        {biomarker.matched ? biomarker.standardUnit : biomarker.originalUnit}
      </td>

      {/* Reference range column */}
      <td className="px-2 py-2 text-sm text-gray-500 text-center">
        {biomarker.referenceMin !== null || biomarker.referenceMax !== null
          ? `${biomarker.referenceMin ?? '-'}-${biomarker.referenceMax ?? '-'}`
          : '-'}
      </td>

      {/* Flag column */}
      <td className="px-2 py-2 text-center">
        <FlagBadge flag={biomarker.flag} />
      </td>

      {/* Status column */}
      <td className="px-2 py-2 text-center">
        <MatchBadge matched={biomarker.matched} />
      </td>
    </tr>
  );
}

function RawBiomarkerRow({ biomarker }: { biomarker: Biomarker }) {
  const flag = getBiomarkerFlag(biomarker);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-2 text-sm text-gray-900 truncate" title={biomarker.name}>{biomarker.name}</td>
      <td className="px-2 py-2 text-sm text-gray-900 text-right font-mono">
        {biomarker.value}
      </td>
      <td className="px-2 py-2 text-sm text-gray-500 truncate">{biomarker.unit}</td>
      <td className="px-2 py-2 text-sm text-gray-500 text-center">
        {biomarker.referenceMin !== undefined || biomarker.referenceMax !== undefined
          ? `${biomarker.referenceMin ?? '-'}-${biomarker.referenceMax ?? '-'}`
          : '-'}
      </td>
      <td className="px-2 py-2 text-center">
        <FlagBadge flag={flag} />
      </td>
    </tr>
  );
}

function ProcessedBiomarkersTable({ biomarkers }: { biomarkers: ProcessedBiomarker[] }) {
  const matched = biomarkers.filter((b) => b.matched);
  const unmatched = biomarkers.filter((b) => !b.matched);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Biomarkers ({biomarkers.length})
        </h4>
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

      {/* Processed biomarkers table */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[500px] table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[30%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="w-[12%] px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="w-[12%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="w-[16%] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Ref
              </th>
              <th className="w-[12%] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Flag
              </th>
              <th className="w-[18%] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {biomarkers.map((biomarker, index) => (
              <ProcessedBiomarkerRow key={index} biomarker={biomarker} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Unmatched biomarkers notice */}
      {unmatched.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Unmatched Biomarkers Need Review
          </h5>
          <p className="text-xs text-amber-700">
            {unmatched.length} biomarker{unmatched.length !== 1 ? 's' : ''} could not be matched
            to our standard library. These will be saved with their original names and values.
            You may want to manually review them after creating the event.
          </p>
        </div>
      )}
    </div>
  );
}

function RawBiomarkersTable({ biomarkers }: { biomarkers: Biomarker[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <FlaskConical className="h-4 w-4" />
        Biomarkers ({biomarkers.length})
        <span className="text-xs font-normal text-gray-500">(raw extraction)</span>
      </h4>
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[400px] table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-[35%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="w-[15%] px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="w-[15%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="w-[20%] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Ref
              </th>
              <th className="w-[15%] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Flag
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {biomarkers.map((biomarker, index) => (
              <RawBiomarkerRow key={index} biomarker={biomarker} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type TabType = 'biomarkers' | 'debug';

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function ExtractionPreview({ upload, onClose }: ExtractionPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('biomarkers');
  const data = upload.extractedData;

  if (!data) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Extraction Preview" size="lg">
        <p className="text-gray-500">No extracted data available.</p>
      </Modal>
    );
  }

  const biomarkerCount = data.processedBiomarkers?.length || data.biomarkers.length;

  return (
    <Modal isOpen={true} onClose={onClose} title="Extraction Preview" size="xl">
      <div className="flex flex-col max-h-[70vh]">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 -mx-6 px-6 flex-shrink-0">
          <TabButton
            active={activeTab === 'biomarkers'}
            onClick={() => setActiveTab('biomarkers')}
          >
            <FlaskConical className="h-4 w-4 inline mr-1.5" />
            Biomarkers ({biomarkerCount})
          </TabButton>
          <TabButton
            active={activeTab === 'debug'}
            onClick={() => setActiveTab('debug')}
          >
            <Bug className="h-4 w-4 inline mr-1.5" />
            Debug Info
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {activeTab === 'biomarkers' ? (
            <>
              {/* Verification Status */}
              <div className="flex items-center gap-2">
                {upload.verificationPassed ? (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Verified by GPT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    {upload.skipVerification ? 'Verification skipped' : 'Unverified'}
                  </span>
                )}
                {upload.extractionConfidence && (
                  <span className="text-sm text-gray-500">
                    • {Math.round(upload.extractionConfidence * 100)}% confidence
                  </span>
                )}
              </div>

              {/* Corrections */}
              {upload.corrections && upload.corrections.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Corrections Applied</h4>
                  <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                    {upload.corrections.map((correction, i) => (
                      <li key={i}>{correction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lab Info */}
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                {data.labName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{data.labName}</span>
                  </div>
                )}
                {data.orderingDoctor && (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{data.orderingDoctor}</span>
                  </div>
                )}
                {data.testDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{data.testDate}</span>
                  </div>
                )}
              </div>

              {/* Biomarkers Table - show processed if available, otherwise raw */}
              {data.processedBiomarkers && data.processedBiomarkers.length > 0 ? (
                <ProcessedBiomarkersTable biomarkers={data.processedBiomarkers} />
              ) : (
                <RawBiomarkersTable biomarkers={data.biomarkers} />
              )}
            </>
          ) : (
            <DebugTab debugInfo={data.debugInfo} />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {upload.eventId ? (
            <Link to={`/event/${upload.eventId}`}>
              <Button variant="primary">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Event
              </Button>
            </Link>
          ) : (
            <Link to={`/event/new/lab_result?fromUpload=${upload.id}`}>
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Lab Result
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
