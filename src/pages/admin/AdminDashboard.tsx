import React, { useEffect, useState } from 'react';
import { Mail, FileText, FileX, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminMetrics, SystemLog } from '@/types';
import { getAdminMetrics } from '@/services/metricsService';
import { getRecentLogs } from '@/services/logService';
import PageHeader from '@/components/dashboard/PageHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="In Review Queue"
          value={metrics?.invoicesInReviewQueue ?? 0}
          icon={ClipboardList}
          variant="warning"
        />
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={recentLogs}
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
