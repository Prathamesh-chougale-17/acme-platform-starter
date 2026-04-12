'use client';

import { startTransition, useEffect, useEffectEvent, useState } from 'react';

import { Badge, Button, Card, CardDescription, CardTitle, Input } from '@acme/ui';
import type { CreateUserInput, UserDto } from '@acme/shared';

import { apiClient } from '@/lib/api-client';

export function UsersWorkspace() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [form, setForm] = useState<CreateUserInput>({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useEffectEvent(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setUsers(await apiClient.getUsers());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to fetch users');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const created = await apiClient.createUser(form);
          setUsers((current) => [created, ...current]);
          setForm({ name: '', email: '' });
          setNotice(`Created ${created.name}`);
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to create user');
        } finally {
          setIsSubmitting(false);
        }
      })();
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge>Users Workspace</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Typed CRUD starter flow
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          This screen exercises the shared Zod contract, the Hono API, and the Drizzle-backed user
          repository without coupling the frontend directly to route implementation details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <Card className="space-y-4">
          <CardTitle>Create a user</CardTitle>
          <CardDescription>Submit a payload to the typed `/api/v1/users` endpoint.</CardDescription>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              placeholder="Jane Doe"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="jane@example.com"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating user...' : 'Create user'}
            </Button>
          </form>
          {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Current users</CardTitle>
              <CardDescription>Loaded from the backend service layer.</CardDescription>
            </div>
            <Button variant="secondary" onClick={() => void loadUsers()}>
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-300">
              No users yet. Create the first record from the form.
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-slate-300">{user.email}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
