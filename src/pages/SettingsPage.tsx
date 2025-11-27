import { Settings, Bot, Palette } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { AISettingsForm } from '@/components/ai';

export function SettingsPage() {
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
            <p className="text-gray-600">
              Customize the look and feel of your application.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Theme settings coming soon.
              </p>
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
            <p className="text-gray-600">
              Manage your account settings and data.
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Account management coming in Phase 5.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
