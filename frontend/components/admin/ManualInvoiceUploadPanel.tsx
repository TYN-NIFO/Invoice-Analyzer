import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadManualInvoice } from '@/services/ingestionService';

const ManualInvoiceUploadPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadManualInvoice,
    onSuccess: (data) => {
      setLastResult(data.result);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['ingestionLogs'] });

      toast({
        title: 'Manual Upload Complete',
        description: `Invoice ${data.result?.invoice_number || ''} processed and synced successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Manual Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'Select a file',
        description: 'Please choose an invoice file to upload.',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Manual Invoice Upload
        </CardTitle>
        <CardDescription>
          Upload an invoice file and run OCR, Drive sync, DB save, and Excel update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.xlsx,.csv"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
        />

        {selectedFile && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{selectedFile.name}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending || !selectedFile}
          className="w-full"
          size="lg"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Upload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload and Process Invoice
            </>
          )}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-1 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Last Upload Result
            </div>
            <p className="text-muted-foreground">Invoice #: {lastResult.invoice_number || 'N/A'}</p>
            <p className="text-muted-foreground">Vendor: {lastResult.vendor_name || 'N/A'}</p>
            <p className="text-muted-foreground">Total: {lastResult.total_amount ?? 0}</p>
            {lastResult.drive_link && (
              <a
                href={lastResult.drive_link}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Open in Google Drive
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualInvoiceUploadPanel;
