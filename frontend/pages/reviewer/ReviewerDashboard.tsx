import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ReviewerMetrics } from '@/types';
import { getReviewerMetrics } from '@/services/metricsService';
import PageHeader from '@/components/dashboard/PageHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ReviewerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsData = await getReviewerMetrics();
        setMetrics(metricsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        title="Reviewer Dashboard" 
        description={`Welcome back, ${user?.username}. Here's your review overview.`}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Invoices Waiting"
          value={metrics?.invoicesWaiting ?? 0}
          icon={ClipboardList}
          variant="warning"
          description="Pending your review"
        />
        <MetricCard
          title="Accepted Invoices"
          value={metrics?.acceptedInvoices ?? 0}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Rejected Invoices"
          value={metrics?.rejectedInvoices ?? 0}
          icon={XCircle}
          variant="danger"
        />
        <MetricCard
          title="Resolved Today"
          value={metrics?.resolvedToday ?? 0}
          icon={Clock}
          variant="primary"
        />
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/reviewer/queue"
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Review Queue
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {metrics?.invoicesWaiting ?? 0} invoices waiting
                  </p>
                </div>
              </div>
            </a>
            <a 
              href="/reviewer/history"
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Decision History
                  </p>
                  <p className="text-sm text-muted-foreground">
                    View your past decisions
                  </p>
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewerDashboard;
