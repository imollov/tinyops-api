import { useState } from 'react';
import { type JobFilters } from '@/lib/api';
import { JobsHeader } from '@/components/JobsHeader';
import { JobFilters as JobFiltersBar } from '@/components/JobFilters';
import { JobsTable } from '@/components/JobsTable';

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);

  return (
    <>
      <JobsHeader lastUpdatedAt={lastUpdatedAt} />

      <JobFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
      />

      <JobsTable filters={filters} onUpdated={setLastUpdatedAt} />
    </>
  );
}
