import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { triggerEmailIngestionSync } from '@/services/emailService';

const EmailIngestionPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<any>(null);

  const ingestionMutation = useMutation({
    mutationFn: triggerEmailIngestionSync,
    onSuccess: (data) => {
      setLastResult(data.result);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['adminMetrics'] });
      
      const processed = data.result?.processed || 0;
      toast({
        title: 'Email Ingestion Complete',
        description: `Processed ${processed} invoice(s) from ${data.result?.total || 0} email(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ingestion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Ingestion
        </CardTitle>
        <CardDescription>
          Process invoices from Gmail inbox using OCR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => ingestionMutation.mutate()}
          disabled={ingestionMutation.isPending}
          className="w-full"
          size="lg"
        >
          {ingestionMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Emails...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Email Ingestion
            </>
          )}
        </Button>

        {lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {lastResult.processed > 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-orange-600" />
              )}
              Last Run Results
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Total Emails: {lastResult.total || 0}</p>
              <p>Invoices Processed: {lastResult.processed || 0}</p>
              <p>Status: {lastResult.message || 'Complete'}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Connects to Gmail inbox</p>
          <p>• Extracts invoice data using Mindee OCR</p>
          <p>• Uploads PDFs to Google Drive</p>
          <p>• Saves to PostgreSQL database</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailIngestionPanel;
