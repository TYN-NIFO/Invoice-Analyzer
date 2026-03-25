import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { InvoiceUpdateForm } from '@/types';
import { getInvoiceById, updateInvoiceStatus, updateInvoice } from '@/services/invoiceService';
import { createLog } from '@/services/logService';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/dashboard/StatusBadge';

const InvoiceReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invoice
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: 'accepted' | 'rejected' }) => {
      if (!invoice || !user) return;
      const result = await updateInvoiceStatus(invoice.id, status, user.username);
      await createLog(user.username, status === 'accepted' ? 'accept_invoice' : 'reject_invoice', `${status === 'accepted' ? 'Accepted' : 'Rejected'} invoice ${invoice.invoiceNumber}`);
      return result;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast({
        title: status === 'accepted' ? 'Invoice Accepted' : 'Invoice Rejected',
        description: `The invoice has been ${status}.`,
      });
      navigate('/reviewer/queue');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: InvoiceUpdateForm) => {
      if (!invoice || !user) return;
      const result = await updateInvoice(invoice.id, data);
      await createLog(user.username, 'update_invoice', `Updated invoice ${invoice.invoiceNumber}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast({
        title: 'Invoice Updated',
        description: 'Changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await statusMutation.mutateAsync({ status: 'accepted' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await statusMutation.mutateAsync({ status: 'rejected' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (data: InvoiceUpdateForm) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Invoice not found</p>
        <Button variant="outline" onClick={() => navigate('/reviewer/queue')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/reviewer/queue')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                Invoice {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground">
              {invoice.vendorName} • {invoice.id}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Preview */}
        <div className="order-2 lg:order-1">
          <InvoicePreview 
            invoiceNumber={invoice.invoiceNumber}
            vendorName={invoice.vendorName}
            pdfUrl={invoice.pdfUrl}
          />
        </div>

        {/* Right: Form */}
        <div className="order-1 lg:order-2">
          <InvoiceForm
            invoice={invoice}
            onAccept={handleAccept}
            onReject={handleReject}
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceReview;
