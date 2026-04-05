import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { JobFilters } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  filters: JobFilters;
  onFiltersChange: (f: JobFilters) => void;
  onReset: () => void;
}

const STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING'] as const;

export function JobFilters({ filters, onFiltersChange, onReset }: Props) {
  const [typeInput, setTypeInput] = useState(filters.type ?? '');
  const debouncedType = useDebounce(typeInput);

  useEffect(() => {
    onFiltersChange({ ...filters, type: debouncedType || undefined });
  }, [debouncedType]);

  const hasAny = typeInput || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Input
        className="h-8 w-40 text-sm"
        placeholder="Filter by type…"
        value={typeInput}
        onChange={(e) => setTypeInput(e.target.value)}
      />

      <Select
        value={filters.status ?? 'ALL'}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            status: v === 'ALL' ? undefined : (v as JobFilters['status']),
          })
        }
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasAny && (
        <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={onReset}>
          Clear
        </Button>
      )}
    </div>
  );
}
