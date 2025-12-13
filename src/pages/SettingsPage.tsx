import { useState } from 'react';
import { Settings, Bot, Palette, Database, Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/common';
import { AISettingsForm } from '@/components/ai';
import { ImportModal } from '@/components/data';
import { useExportEvents } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/types/theme';
import { cn } from '@/utils/cn';

const themeOptions: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Light background with dark text' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark background with light text' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follows your device settings' },
];

export function SettingsPage() {
  const { exportAll, isExporting, error: exportError } = useExportEvents();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleImportSuccess = () => {
    // Could trigger a refetch or show a success toast
    // For now, just close the modal and let user navigate to timeline
  };

  return (
    <PageWrapper title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AISettingsForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-zinc-400 mb-4">
              Customize the look and feel of your application.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    theme === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  )}
                >
                  <Icon className={cn(
                    'h-6 w-6',
                    theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'
                  )} />
                  <span className={cn(
                    'font-medium',
                    theme === value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-zinc-100'
                  )}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-zinc-400 mb-4">
              Export or import your health data for backup or transfer.
            </p>

            <div className="space-y-4">
              {/* Export Section */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                <h4 className="font-medium text-gray-900 dark:text-zinc-100 mb-2">Export Data</h4>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                  Download all your health events in JSON or CSV format.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => exportAll({ format: 'json' })}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export as JSON'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportAll({ format: 'csv' })}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export as CSV'}
                  </Button>
                </div>
                {exportError && (
                  <p className="mt-2 text-sm text-red-600">{exportError}</p>
                )}
              </div>

              {/* Import Section */}
              <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
                <h4 className="font-medium text-gray-900 dark:text-zinc-100 mb-2">Import Data</h4>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                  Import health events from a previously exported JSON file.
                </p>
                <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-zinc-400">
              Manage your account settings and data.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 dark:bg-zinc-700 p-4">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Account management coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </PageWrapper>
  );
}
