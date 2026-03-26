import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InvoicePreviewProps {
  invoiceId?: string;
  invoiceNumber: string;
  vendorName: string;
  pdfUrl?: string;
  driveFileId?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceId,
  invoiceNumber,
  vendorName,
  pdfUrl,
  driveFileId
}) => {
  // Use the backend file endpoint to serve the invoice
  const fileUrl = invoiceId ? `/invoices/${invoiceId}/file` : null;

  // Determine if it's an image or PDF based on the URL
  const isImage = pdfUrl && /\.(jpg|jpeg|png|webp)$/i.test(pdfUrl);

  return (
    <Card className="h-full shadow-card overflow-hidden">
      <CardContent className="p-0 h-full">
        {fileUrl ? (
          isImage ? (
            <img
              src={fileUrl}
              className="w-full h-full min-h-[600px] object-contain bg-muted/10"
              alt={`Invoice ${invoiceNumber}`}
            />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[600px] border-0"
              title={`Invoice ${invoiceNumber}`}
            />
          )
        ) : (
          <div className="h-full min-h-[600px] bg-muted/30 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md bg-card rounded-lg shadow-lg border border-border p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{vendorName}</p>
                    <p className="text-sm text-muted-foreground">Invoice Document</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Invoice #</p>
                  <p className="font-mono font-bold text-foreground">{invoiceNumber}</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No invoice file available
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
