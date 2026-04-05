import { Badge } from '@/components/ui/badge';
import type { JobStatus } from '@/lib/api';

const variants: Record<JobStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  PROCESSING: 'secondary',
  COMPLETED: 'default',
  FAILED: 'destructive',
  RETRYING: 'secondary',
};

const labels: Record<JobStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
