import { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle, XCircle, FileJson } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { useImportEvents } from '@/hooks';
import type { ImportResult } from '@/lib/importData';
import type { CreateEventInput } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [eventsToImport, setEventsToImport] = useState<CreateEventInput[]>([]);

  const { validateFile, importEvents, isValidating, progress, reset } = useImportEvents();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const result = await validateFile(file);
    setValidationResult(result);

    if (result.success && result.events.length > 0) {
      setEventsToImport(result.events);
      setStep('preview');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const result = await validateFile(file);
    setValidationResult(result);

    if (result.success && result.events.length > 0) {
      setEventsToImport(result.events);
      setStep('preview');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    setStep('importing');
    await importEvents(eventsToImport);
    // Always advance to complete step so user sees results/errors
    setStep('complete');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    setValidationResult(null);
    setEventsToImport([]);
    reset();
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onSuccess();
  };

  // Count events by type for preview
  const eventTypeCounts = eventsToImport.reduce(
    (acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Data">
      <div className="space-y-4">
        {/* Upload Step */}
        {step === 'upload' && (
          <>
            <p className="text-sm text-gray-600">
              Upload a JSON file exported from this application to import your health events.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileJson className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              {isValidating ? (
                <p className="text-gray-600">Validating file...</p>
              ) : (
                <>
                  <p className="text-gray-900 font-medium">
                    Drop your JSON file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max file size: 10MB</p>
                </>
              )}
            </div>

            {/* Validation Errors */}
            {validationResult && !validationResult.success && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-red-800">Validation Failed</h4>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview Step */}
        {step === 'preview' && validationResult && (
          <>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">File validated successfully</span>
            </div>

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-amber-800">Warnings</h4>
                    <ul className="mt-1 text-sm text-amber-700">
                      {validationResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Import Preview</h4>
              <p className="text-sm text-gray-600 mb-3">
                Found <strong>{eventsToImport.length}</strong> events to import from{' '}
                <strong>{fileName}</strong>
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(eventTypeCounts).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                  >
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Import {eventsToImport.length} Events
              </Button>
            </div>
          </>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">Importing events...</p>
            <p className="text-sm text-gray-500 mt-1">
              {progress.completed} of {progress.total} events imported
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete</h3>
            <p className="text-gray-600">
              Successfully imported <strong>{progress.completed}</strong> events
              {progress.failed > 0 && (
                <span className="text-red-600">
                  {' '}
                  ({progress.failed} failed)
                </span>
              )}
            </p>

            {/* Import errors */}
            {progress.errors.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-left">
                <h4 className="font-medium text-red-800 mb-2">Failed to import:</h4>
                <ul className="text-sm text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
                  {progress.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <Button onClick={handleComplete}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
