'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@acme/ui';

import { authClient } from '@/lib/auth-client';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to switch the active workspace right now.';

export function OrganizationSwitcher({
  currentOrganizationId,
  currentOrganizationName,
}: {
  currentOrganizationId: string;
  currentOrganizationName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const organizationsQuery = authClient.useListOrganizations();
  const activeOrganizationQuery = authClient.useActiveOrganization();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const organizations = organizationsQuery.data ?? [];
  const activeOrganizationId = activeOrganizationQuery.data?.id ?? currentOrganizationId;
  const activeOrganizationName =
    organizations.find((organization) => organization.id === activeOrganizationId)?.name ??
    activeOrganizationQuery.data?.name ??
    currentOrganizationName;
  const deniedTarget = searchParams.get('denied');
  const nextRoute = useMemo(() => {
    if (deniedTarget?.startsWith('/')) {
      return deniedTarget;
    }

    return pathname ?? '/users';
  }, [deniedTarget, pathname]);

  if (organizations.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 md:flex">
        <Badge variant="outline">Workspace</Badge>
        <span className="max-w-52 truncate">{currentOrganizationName}</span>
      </div>
    );
  }

  return (
    <div className="hidden min-w-72 flex-col gap-2 md:flex">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
        <Badge variant="outline">Workspace</Badge>
        <Select
          value={activeOrganizationId}
          onValueChange={(organizationId) => {
            if (organizationId === activeOrganizationId) {
              return;
            }

            setError(null);
            startTransition(async () => {
              try {
                const response = (await authClient.organization.setActive({
                  organizationId,
                })) as {
                  error?: {
                    message?: string;
                  } | null;
                };

                if (response.error) {
                  setError(response.error.message ?? 'Unable to switch organization.');
                  return;
                }

                router.push(nextRoute as never);
                router.refresh();
              } catch (caughtError) {
                setError(getErrorMessage(caughtError));
              }
            });
          }}
          disabled={isPending || organizationsQuery.isPending}
        >
          <SelectTrigger className="h-9 flex-1 border-0 bg-transparent px-0 text-sm text-slate-200 shadow-none focus:ring-0">
            <span className="line-clamp-1 flex-1 text-left">{activeOrganizationName}</span>
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Workspace switch failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
