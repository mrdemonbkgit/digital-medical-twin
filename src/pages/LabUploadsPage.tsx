import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileUp, BookOpen } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, FullPageSpinner } from '@/components/common';
import { LabUploadDropzone, LabUploadList } from '@/components/labUpload';
import { useRequireProfile } from '@/hooks/useRequireProfile';

export function LabUploadsPage() {
  const { isLoading: isProfileLoading, isComplete } = useRequireProfile();
  const refetchRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefetchRef = useCallback((refetch: () => Promise<void>) => {
    refetchRef.current = refetch;
  }, []);

  const handleUploadComplete = useCallback(() => {
    // Refetch uploads after a successful upload using the list's refetch
    refetchRef.current?.();
  }, []);

  // Show loading while checking profile status
  if (isProfileLoading) {
    return <FullPageSpinner />;
  }

  // Will redirect if profile not complete
  if (!isComplete) {
    return null;
  }

  return (
    <PageWrapper title="Lab Uploads">
      <div className="space-y-6">
        {/* Header with back link and biomarkers reference */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
          <Link to="/biomarkers">
            <Button variant="secondary" size="sm">
              <BookOpen className="w-4 h-4 mr-1" />
              Biomarker Reference
            </Button>
          </Link>
        </div>

        {/* Page description */}
        <Card>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileUp className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Lab Results
                </h2>
                <p className="mt-1 text-gray-600">
                  Upload your lab result PDFs here for automatic data extraction.
                  Our AI will extract biomarkers, reference ranges, and other details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload zone */}
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <LabUploadDropzone onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {/* Uploads list */}
        <Card>
          <CardHeader>
            <CardTitle>Your Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <LabUploadList onRefetchRef={handleRefetchRef} />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
