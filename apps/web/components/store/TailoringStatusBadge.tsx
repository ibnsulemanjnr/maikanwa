import Badge from '@/components/ui/Badge';

type TailoringStatus = 'MEASUREMENT_PENDING' | 'CUTTING' | 'SEWING' | 'QA' | 'READY' | 'DELIVERED';

interface TailoringStatusBadgeProps {
  status: TailoringStatus;
}

const statusConfig: Record<TailoringStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  MEASUREMENT_PENDING: { label: 'Awaiting Measurements', variant: 'warning' },
  CUTTING: { label: 'Cutting', variant: 'info' },
  SEWING: { label: 'Sewing', variant: 'info' },
  QA: { label: 'Quality Check', variant: 'info' },
  READY: { label: 'Ready', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
};

export default function TailoringStatusBadge({ status }: TailoringStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
