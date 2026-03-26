import React, { useEffect, useState } from 'react';
import { Mail, FileText, FileX, ClipboardList, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminMetrics, SystemLog } from '@/types';
import { getAdminMetrics } from '@/services/metricsService';
import { getRecentLogs } from '@/services/logService';
import PageHeader from '@/components/dashboard/PageHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmailIngestionPanel from '@/components/admin/EmailIngestionPanel';
import ManualInvoiceUploadPanel from '@/components/admin/ManualInvoiceUploadPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from '@/lib/dateUtils';

type ActivitySortField = 'timestamp' | 'username' | 'action';
type SortDirection = 'asc' | 'desc';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<ActivitySortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, logsData] = await Promise.all([
          getAdminMetrics(),
          getRecentLogs(5),
        ]);
        setMetrics(metricsData);
        setRecentLogs(logsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const logColumns: Column<SystemLog>[] = [
    {
      key: 'username',
      header: 'User',
      render: (log) => (
        <span className="font-medium text-foreground">{log.username}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <span className="capitalize text-muted-foreground">
          {log.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Time',
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
        </span>
      ),
    },
  ];

  const sortedRecentLogs = [...recentLogs].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortField === 'username') {
      comparison = a.username.localeCompare(b.username);
    } else {
      comparison = a.action.localeCompare(b.action);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description={`Welcome back, ${user?.username}. Here's your system overview.`}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Emails Processed"
          value={metrics?.totalEmailsProcessed ?? 0}
          icon={Mail}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Invoice Emails"
          value={metrics?.invoiceEmailsDetected ?? 0}
          icon={FileText}
          variant="success"
        />
        <MetricCard
          title="Non-Invoice Emails"
          value={metrics?.nonInvoiceEmails ?? 0}
          icon={FileX}
          variant="default"
        />
        <MetricCard
          title="Security Emails"
          value={metrics?.securityEmails ?? 0}
          icon={ShieldAlert}
          variant="danger"
        />
        <MetricCard
          title="In Review Queue"
          value={metrics?.invoicesInReviewQueue ?? 0}
          icon={ClipboardList}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EmailIngestionPanel />
        <ManualInvoiceUploadPanel />
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as ActivitySortField)}
              >
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Time</SelectItem>
                  <SelectItem value="username">User</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
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
            data={sortedRecentLogs}
            columns={logColumns}
            keyExtractor={(log) => log.id}
            emptyMessage="No recent activity"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
