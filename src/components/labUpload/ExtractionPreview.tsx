import { Link } from 'react-router-dom';
import {
  User,
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
  Info,
} from 'lucide-react';
import { Modal, Button } from '@/components/common';
import type { LabUpload, Biomarker, ProcessedBiomarker } from '@/types';

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
      <td className="px-4 py-2">
        <div className="text-sm text-gray-900">
          {biomarker.matched ? biomarker.standardName : biomarker.originalName}
        </div>
        {biomarker.matched && biomarker.originalName !== biomarker.standardName && (
          <div className="text-xs text-gray-500">
            Original: {biomarker.originalName}
          </div>
        )}
        {biomarker.standardCode && (
          <div className="text-xs text-gray-400 font-mono">
            {biomarker.standardCode}
          </div>
        )}
      </td>

      {/* Value column with original and standardized */}
      <td className="px-4 py-2 text-right">
        <div className="text-sm text-gray-900 font-mono">
          {biomarker.matched && biomarker.standardValue !== null
            ? biomarker.standardValue.toFixed(2)
            : biomarker.originalValue}
        </div>
        {biomarker.matched &&
          biomarker.standardValue !== null &&
          biomarker.standardValue !== biomarker.originalValue && (
            <div className="text-xs text-gray-500">
              Original: {biomarker.originalValue} {biomarker.originalUnit}
            </div>
          )}
      </td>

      {/* Unit column */}
      <td className="px-4 py-2 text-sm text-gray-500">
        {biomarker.matched ? biomarker.standardUnit : biomarker.originalUnit}
      </td>

      {/* Reference range column */}
      <td className="px-4 py-2 text-sm text-gray-500 text-center">
        {biomarker.referenceMin !== null || biomarker.referenceMax !== null
          ? `${biomarker.referenceMin ?? '-'} - ${biomarker.referenceMax ?? '-'}`
          : '-'}
      </td>

      {/* Flag column */}
      <td className="px-4 py-2 text-center">
        <FlagBadge flag={biomarker.flag} />
      </td>

      {/* Status column */}
      <td className="px-4 py-2 text-center">
        <MatchBadge matched={biomarker.matched} />
        {biomarker.validationIssues && biomarker.validationIssues.length > 0 && (
          <div className="mt-1">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 cursor-help"
              title={biomarker.validationIssues.join(', ')}
            >
              <Info className="h-3 w-3" />
              Issues
            </span>
          </div>
        )}
      </td>
    </tr>
  );
}

function RawBiomarkerRow({ biomarker }: { biomarker: Biomarker }) {
  const flag = getBiomarkerFlag(biomarker);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 text-sm text-gray-900">{biomarker.name}</td>
      <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono">
        {biomarker.value}
        {biomarker.secondaryValue && (
          <span className="text-gray-400 text-xs ml-1">
            ({biomarker.secondaryValue} {biomarker.secondaryUnit})
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-sm text-gray-500">{biomarker.unit}</td>
      <td className="px-4 py-2 text-sm text-gray-500 text-center">
        {biomarker.referenceMin !== undefined || biomarker.referenceMax !== undefined
          ? `${biomarker.referenceMin ?? '-'} - ${biomarker.referenceMax ?? '-'}`
          : '-'}
      </td>
      <td className="px-4 py-2 text-center">
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Flag
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
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

export function ExtractionPreview({ upload, onClose }: ExtractionPreviewProps) {
  const data = upload.extractedData;

  if (!data) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Extraction Preview" size="lg">
        <p className="text-gray-500">No extracted data available.</p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Extraction Preview" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
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

        {/* Patient Info */}
        {(data.clientName || data.clientGender || data.clientBirthday) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h4>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              {data.clientName && (
                <div>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="text-gray-900">{data.clientName}</span>
                </div>
              )}
              {data.clientGender && (
                <div>
                  <span className="text-gray-500">Gender:</span>{' '}
                  <span className="text-gray-900 capitalize">{data.clientGender}</span>
                </div>
              )}
              {data.clientBirthday && (
                <div>
                  <span className="text-gray-500">Birthday:</span>{' '}
                  <span className="text-gray-900">{data.clientBirthday}</span>
                </div>
              )}
            </div>
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
