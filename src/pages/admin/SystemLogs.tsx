import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogs } from '@/services/logService';
import { SystemLog } from '@/types';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const actionStyles: Record<string, string> = {
  login: 'bg-primary/10 text-primary border-primary/20',
  logout: 'bg-muted text-muted-foreground border-muted',
  create_user: 'bg-success/10 text-success border-success/20',
  accept_invoice: 'bg-success/10 text-success border-success/20',
  reject_invoice: 'bg-destructive/10 text-destructive border-destructive/20',
  view_invoice: 'bg-info/10 text-info border-info/20',
  update_invoice: 'bg-warning/10 text-warning border-warning/20',
};

const SystemLogs: React.FC = () => {
  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => getLogs(undefined, 1, 50),
  });

  const columns: Column<SystemLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      className: 'w-40',
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (log) => (
        <span className="font-medium text-foreground">{log.username}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <Badge 
          variant="outline"
          className={actionStyles[log.action] || 'bg-muted text-muted-foreground'}
        >
          {log.action.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {log.details || '-'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      className: 'w-32',
      render: (log) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {log.ipAddress || 'N/A'}
        </code>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Logs" 
        description="View all system activity and audit trail."
      />

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>
            Showing {logsResponse?.data.length ?? 0} of {logsResponse?.total ?? 0} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={logsResponse?.data ?? []}
            columns={columns}
            keyExtractor={(log) => log.id}
            isLoading={isLoading}
            emptyMessage="No logs available"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;
