import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InvoiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: string }> = {
  pending: {
    label: 'Pending',
    variant: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  },
  in_review: {
    label: 'In Review',
    variant: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
  },
  accepted: {
    label: 'Accepted',
    variant: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  rejected: {
    label: 'Rejected',
    variant: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", config.variant, className)}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
