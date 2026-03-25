import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '@/services/invoiceService';
import { Invoice } from '@/types';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const DecisionHistory: React.FC = () => {
  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ['invoiceHistory'],
    queryFn: () => getInvoices(undefined, 1, 50),
  });

  // Filter to only show accepted/rejected
  const processedInvoices = invoicesResponse?.data.filter(
    (inv) => inv.status === 'accepted' || inv.status === 'rejected'
  ) ?? [];

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      header: 'Invoice ID',
      render: (invoice) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {invoice.id}
        </span>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      render: (invoice) => (
        <span className="font-medium text-foreground">{invoice.vendorName}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (invoice) => (
        <span className="text-foreground">
          ${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Decision',
      render: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: 'reviewedBy',
      header: 'Reviewed By',
      render: (invoice) => (
        <span className="text-muted-foreground">{invoice.reviewedBy || '-'}</span>
      ),
    },
    {
      key: 'reviewedAt',
      header: 'Decision Date',
      render: (invoice) => (
        <span className="text-sm text-muted-foreground">
          {invoice.reviewedAt 
            ? format(new Date(invoice.reviewedAt), 'MMM d, yyyy HH:mm')
            : '-'
          }
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Decision History" 
        description="View your past invoice decisions."
      />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Processed Invoices</CardTitle>
          <CardDescription>
            {processedInvoices.length} invoices processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedInvoices}
            columns={columns}
            keyExtractor={(invoice) => invoice.id}
            isLoading={isLoading}
            emptyMessage="No decisions made yet"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DecisionHistory;
