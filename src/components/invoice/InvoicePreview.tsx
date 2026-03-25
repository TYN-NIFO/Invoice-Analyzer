import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InvoicePreviewProps {
  invoiceNumber: string;
  vendorName: string;
  pdfUrl?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  invoiceNumber, 
  vendorName,
  pdfUrl 
}) => {
  // In production, this would render an actual PDF viewer
  // For now, show a placeholder that represents the invoice document

  return (
    <Card className="h-full shadow-card overflow-hidden">
      <CardContent className="p-0 h-full">
        {pdfUrl ? (
          <iframe 
            src={pdfUrl} 
            className="w-full h-full min-h-[600px]"
            title={`Invoice ${invoiceNumber}`}
          />
        ) : (
          <div className="h-full min-h-[600px] bg-muted/30 flex flex-col items-center justify-center p-8">
            {/* Simulated Invoice Document */}
            <div className="w-full max-w-md bg-card rounded-lg shadow-lg border border-border p-8">
              {/* Header */}
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

              {/* Content Placeholders */}
              <div className="space-y-4 mb-8">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>

              {/* Line Items Placeholder */}
              <div className="border-t border-b border-border py-4 mb-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-2/5" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Total</span>
                <div className="h-6 bg-primary/10 rounded w-24" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Invoice preview • PDF viewer integration ready
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
