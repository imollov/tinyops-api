import { useState, type SubmitEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJob } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL_FORM = { type: '', payloadRaw: '{}', payloadError: '', runAt: '' };

export function AddJobDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const { mutate, isPending, error } = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      setOpen(false);
      reset();
    },
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setField('payloadError', '');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(form.payloadRaw) as Record<string, unknown>;
      if (typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
    } catch {
      setField('payloadError', 'Payload must be a valid JSON object');
      return;
    }

    mutate({ type: form.type, payload, runAt: form.runAt || undefined });
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(INITIAL_FORM);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground shadow-xs h-8 px-3 cursor-pointer hover:bg-primary/90 transition-colors"
        render={<button />}
      >
        New job
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="job-type">Type</Label>
            <Input
              id="job-type"
              placeholder="e.g. send-email"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-payload">Payload (JSON)</Label>
            <textarea
              id="job-payload"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:outline-none font-mono resize-none"
              value={form.payloadRaw}
              onChange={(e) => setField('payloadRaw', e.target.value)}
              spellCheck={false}
            />
            {form.payloadError && <p className="text-sm text-destructive">{form.payloadError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-run-at">Run at (optional)</Label>
            <Input
              id="job-run-at"
              type="datetime-local"
              value={form.runAt ? new Date(form.runAt).toISOString().slice(0, 16) : ''}
              onChange={(e) =>
                setField('runAt', e.target.value ? new Date(e.target.value).toISOString() : '')
              }
            />
          </div>
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
