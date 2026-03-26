import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDecisionHistory } from '@/services/invoiceService';
import { Invoice } from '@/types';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/dateUtils';

type HistorySortField = 'reviewedAt' | 'vendorName' | 'totalAmount' | 'id';
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

const DecisionHistory: React.FC = () => {
  const [sortField, setSortField] = useState<HistorySortField>('reviewedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const { data: processedInvoices = [], isLoading } = useQuery({
    queryKey: ['invoiceHistory'],
    queryFn: getDecisionHistory,
  });

  const filteredAndSortedProcessedInvoices = useMemo(() => {
    const data = [...processedInvoices]
      .filter((invoice) => isWithinTimeRange(invoice.reviewedAt || invoice.createdAt, timeFilter));

    data.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'reviewedAt') {
        comparison = new Date(a.reviewedAt || a.createdAt).getTime() - new Date(b.reviewedAt || b.createdAt).getTime();
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
  }, [processedInvoices, sortField, sortDirection, timeFilter]);

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
          ₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg">Processed Invoices</CardTitle>
              <CardDescription>
                {processedInvoices.length} invoices processed
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortField} onValueChange={(value) => setSortField(value as HistorySortField)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewedAt">Decision Date</SelectItem>
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
            data={filteredAndSortedProcessedInvoices}
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
