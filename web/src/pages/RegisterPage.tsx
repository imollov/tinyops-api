import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ username: '', email: '', password: '', name: '' });

  const { mutate, isPending, error } = useMutation({
    mutationFn: register,
    onSuccess: (data) => qc.setQueryData(['me'], data),
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    mutate({
      username: form.username,
      email: form.email,
      password: form.password,
      name: form.name || undefined,
    });
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={form.username}
                onChange={field('username')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="name" autoComplete="name" value={form.name} onChange={field('name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={field('email')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={field('password')}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
