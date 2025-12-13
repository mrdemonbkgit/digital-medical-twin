import { useState } from 'react';
import { Settings, Bot, Palette, Database, Download, Upload, Sun, Moon, Monitor, Waves, TreePine } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/common';
import { AISettingsForm } from '@/components/ai';
import { ImportModal } from '@/components/data';
import { useExportEvents } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/types/theme';
import { cn } from '@/utils/cn';

const themeOptions: { value: Theme; label: string; icon: typeof Sun; description: string; preview: { bg: string; accent: string } }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright', preview: { bg: '#f9fafb', accent: '#2563eb' } },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes', preview: { bg: '#18181b', accent: '#3b82f6' } },
  { value: 'ocean', label: 'Ocean', icon: Waves, description: 'Deep blue waters', preview: { bg: '#0f2942', accent: '#22d3ee' } },
  { value: 'forest', label: 'Forest', icon: TreePine, description: 'Natural greens', preview: { bg: '#1a2e1a', accent: '#4ade80' } },
  { value: 'system', label: 'System', icon: Monitor, description: 'Match device', preview: { bg: '#f9fafb', accent: '#2563eb' } },
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
            <p className="text-theme-secondary mb-4">
              Choose your preferred theme for the application.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {themeOptions.map(({ value, label, icon: Icon, description, preview }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    theme === value
                      ? 'border-accent bg-info-muted'
                      : 'border-theme-primary hover:border-theme-secondary bg-theme-secondary'
                  )}
                >
                  {/* Theme preview circle */}
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                    style={{ backgroundColor: preview.bg, borderColor: preview.accent }}
                  >
                    <Icon className="h-5 w-5" style={{ color: preview.accent }} />
                  </div>
                  <span className={cn(
                    'font-medium text-sm',
                    theme === value ? 'text-accent' : 'text-theme-primary'
                  )}>
                    {label}
                  </span>
                  <span className="text-xs text-theme-muted text-center">
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
            <p className="text-theme-secondary mb-4">
              Export or import your health data for backup or transfer.
            </p>

            <div className="space-y-4">
              {/* Export Section */}
              <div className="rounded-lg border border-theme-primary p-4">
                <h4 className="font-medium text-theme-primary mb-2">Export Data</h4>
                <p className="text-sm text-theme-tertiary mb-3">
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
                  <p className="mt-2 text-sm text-danger">{exportError}</p>
                )}
              </div>

              {/* Import Section */}
              <div className="rounded-lg border border-theme-primary p-4">
                <h4 className="font-medium text-theme-primary mb-2">Import Data</h4>
                <p className="text-sm text-theme-tertiary mb-3">
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
            <p className="text-theme-secondary">
              Manage your account settings and data.
            </p>
            <div className="mt-4 rounded-lg bg-theme-tertiary p-4">
              <p className="text-sm text-theme-tertiary">
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
