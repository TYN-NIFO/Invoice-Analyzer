import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type MetricVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: MetricVariant;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const variantStyles: Record<MetricVariant, { bg: string; icon: string; border: string }> = {
  default: {
    bg: 'bg-muted/50',
    icon: 'text-muted-foreground',
    border: 'border-border',
  },
  primary: {
    bg: 'bg-primary/10',
    icon: 'text-primary',
    border: 'border-primary/20',
  },
  success: {
    bg: 'bg-success/10',
    icon: 'text-success',
    border: 'border-success/20',
  },
  warning: {
    bg: 'bg-warning/10',
    icon: 'text-warning',
    border: 'border-warning/20',
  },
  danger: {
    bg: 'bg-destructive/10',
    icon: 'text-destructive',
    border: 'border-destructive/20',
  },
  info: {
    bg: 'bg-info/10',
    icon: 'text-info',
    border: 'border-info/20',
  },
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
  description,
  trend,
  className,
}) => {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("shadow-card border transition-shadow hover:shadow-md", styles.border, className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", styles.bg)}>
            <Icon className={cn("w-6 h-6", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
