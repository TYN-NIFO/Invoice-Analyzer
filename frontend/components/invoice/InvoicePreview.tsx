import React, { useState, useEffect } from 'react';
import { FileText, ZoomIn, ZoomOut, Maximize2, Minimize2, Download, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api';

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
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = pdfUrl && /\.(jpg|jpeg|png|webp)$/i.test(pdfUrl);

  // Fetch pre-signed S3 URL from the backend
  useEffect(() => {
    if (!invoiceId) return;

    setLoading(true);
    setError(null);

    apiClient
      .get(`/invoices/${invoiceId}/file-url`)
      .then((res) => {
        setDirectUrl(res.data.url);
      })
      .catch(() => {
        setError('Failed to load file');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [invoiceId]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    if (directUrl) {
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = `invoice-${invoiceNumber}.${isImage ? 'jpg' : 'pdf'}`;
      a.target = '_blank';
      a.click();
    }
  };

  const handleOpenNewTab = () => {
    if (directUrl) window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
      <Card className={`shadow-card overflow-hidden ${isFullscreen ? 'h-full rounded-none border-0' : 'h-full'}`}>
        <CardContent className="p-0 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {invoiceNumber} — {vendorName}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isImage && directUrl && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom out">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom in">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate} title="Rotate">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                </>
              )}

              {directUrl && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenNewTab} title="Open in new tab">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-muted/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            ) : error || !directUrl ? (
              <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {error || 'No file available'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invoice {invoiceNumber} from {vendorName}
                </p>
              </div>
            ) : isImage ? (
              <div className="flex items-center justify-center min-h-[600px] p-4">
                <img
                  src={directUrl}
                  className="max-w-full h-auto shadow-lg rounded transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  alt={`Invoice ${invoiceNumber}`}
                />
              </div>
            ) : (
              <iframe
                src={directUrl}
                className="w-full border-0"
                style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '700px' }}
                title={`Invoice ${invoiceNumber}`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicePreview;
