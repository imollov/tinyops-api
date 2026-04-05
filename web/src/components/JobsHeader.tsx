import { AddJobDialog } from '@/components/AddJobDialog';
import { formatDate } from '@/lib/utils';

interface Props {
  lastUpdatedAt: number;
}

export function JobsHeader({ lastUpdatedAt }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold">Jobs</h1>
        {lastUpdatedAt > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Updated {formatDate(new Date(lastUpdatedAt).toISOString())}
          </p>
        )}
      </div>
      <AddJobDialog />
    </div>
  );
}
