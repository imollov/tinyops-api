import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchJobs, type JobFilters } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Props {
  filters: JobFilters;
  onUpdated?: (ts: number) => void;
}

export function JobsTable({ filters, onUpdated }: Props) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [page, setPage] = useState(0);
  const cursor = cursors[page];

  const { data, error } = useQuery({
    queryKey: ['jobs', filters, cursor],
    queryFn: async () => {
      const result = await fetchJobs(filters, cursor);
      onUpdated?.(Date.now());
      return result;
    },
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const jobs = data?.jobs ?? [];

  function goNext() {
    if (!data?.nextCursor) return;
    const next = [...cursors];
    next[page + 1] = data.nextCursor;
    setCursors(next);
    setPage(page + 1);
  }

  function goPrev() {
    if (page === 0) return;
    setPage(page - 1);
  }

  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (jobs.length === 0) return <p className="text-sm text-muted-foreground">No jobs found.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['ID', 'Type', 'Status', 'Attempts', 'Created', 'Last error'].map((h) => (
                <th
                  key={h}
                  className="py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
              >
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground w-36 truncate">
                  {job.id.slice(0, 8)}…
                </td>
                <td className="py-3 px-4 text-sm font-medium">{job.type}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{job.attempts}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(job.createdAt)}
                </td>
                <td className="py-3 px-4 text-xs text-destructive max-w-xs truncate">
                  {job.lastError ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(page > 0 || data.nextCursor) && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1}</span>
          <Button variant="outline" size="sm" onClick={goNext} disabled={!data.nextCursor}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
