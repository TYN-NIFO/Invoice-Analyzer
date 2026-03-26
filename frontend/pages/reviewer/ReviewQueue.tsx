import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, ExternalLink } from 'lucide-react';
import { Invoice } from '@/types';
import { getReviewQueue } from '@/services/invoiceService';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from '@/lib/dateUtils';
import { API_BASE_URL } from '@/services/api';

type QueueSortField = 'invoiceDate' | 'vendorName' | 'totalAmount' | 'id';
type SortDirection = 'asc' | 'desc';
type TimeFilter = 'all' | 'today' | 'last7' | 'last30' | 'last90';

const isWithinTimeRange = (dateValue?: string, filter: TimeFilter = 'all'): boolean => {
  if (filter === 'all') {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const targetDate = new Date(dateValue);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const now = new Date();
  if (filter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return targetDate >= startOfToday;
  }

  const days = filter === 'last7' ? 7 : filter === 'last30' ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return targetDate >= cutoff;
};

const ReviewQueue: React.FC = () => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<QueueSortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: getReviewQueue,
  });

  const filteredAndSortedInvoices = useMemo(() => {
    const data = [...(invoices ?? [])]
      .filter((invoice) => isWithinTimeRange(invoice.createdAt || invoice.invoiceDate, timeFilter));

    data.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'invoiceDate') {
        comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      } else if (sortField === 'vendorName') {
        comparison = a.vendorName.localeCompare(b.vendorName);
      } else if (sortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      } else {
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [invoices, sortField, sortDirection, timeFilter]);

  const handleReview = (invoiceId: string) => {
    navigate(`/reviewer/invoice/${invoiceId}`);
  };

  const handleViewFile = (invoiceId: string, pdfUrl?: string) => {
    if (!pdfUrl) {
      return;
    }
    window.open(`${API_BASE_URL}/invoices/${invoiceId}/file`, '_blank', 'noopener,noreferrer');
  };

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
      header: 'Vendor Name',
      render: (invoice) => (
        <span className="font-medium text-foreground">{invoice.vendorName}</span>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      render: (invoice) => (
        <span className="text-muted-foreground">
          {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (invoice) => (
        <span className="font-medium text-foreground">
          ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-52',
      render: (invoice) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!invoice.pdfUrl}
            onClick={(e) => {
              e.stopPropagation();
              handleViewFile(invoice.id, invoice.pdfUrl);
            }}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            File
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReview(invoice.id);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Review Queue" 
        description="Review and process pending invoices."
      />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Pending Invoices</CardTitle>
              <CardDescription>
                {invoices?.length ?? 0} invoices waiting for review
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortField} onValueChange={(value) => setSortField(value as QueueSortField)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoiceDate">Invoice Date</SelectItem>
                  <SelectItem value="vendorName">Vendor</SelectItem>
                  <SelectItem value="totalAmount">Amount</SelectItem>
                  <SelectItem value="id">Invoice ID</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="last90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              >
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredAndSortedInvoices}
            columns={columns}
            keyExtractor={(invoice) => invoice.id}
            isLoading={isLoading}
            emptyMessage="No invoices in the queue"
            onRowClick={(invoice) => handleReview(invoice.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewQueue;
