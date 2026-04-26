'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@acme/ui';

import { authClient } from '@/lib/auth-client';
import { apiClient } from '@/lib/api-client';
import { useOnboardingQuery } from '@/lib/queries';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to complete onboarding right now.';

export function OnboardingWorkspace({ redirectTo = '/users' }: { redirectTo?: string }) {
  const router = useRouter();
  const onboardingQuery = useOnboardingQuery();
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreating] = useTransition();
  const [isSelecting, startSelecting] = useTransition();

  const state = onboardingQuery.data;
  const organizations = state?.viewer.organizations ?? [];
  const onlyOrganization = organizations.length === 1 ? organizations[0] : null;
  const destination = useMemo(() => redirectTo || '/users', [redirectTo]);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.nextStep === 'ready') {
      router.replace(destination as never);
      return;
    }

    if (state.nextStep === 'select-workspace' && onlyOrganization) {
      setError(null);
      startSelecting(async () => {
        try {
          const response = (await authClient.organization.setActive({
            organizationId: onlyOrganization.id,
          })) as {
            error?: {
              message?: string;
            } | null;
          };

          if (response.error) {
            setError(response.error.message ?? 'Unable to activate the workspace.');
            return;
          }

          router.replace(destination as never);
          router.refresh();
        } catch (caughtError) {
          setError(getErrorMessage(caughtError));
        }
      });
    }
  }, [destination, onlyOrganization, router, state]);

  const activateWorkspace = (organizationId: string) => {
    setError(null);
    startSelecting(async () => {
      try {
        const response = (await authClient.organization.setActive({
          organizationId,
        })) as {
          error?: {
            message?: string;
          } | null;
        };

        if (response.error) {
          setError(response.error.message ?? 'Unable to activate the workspace.');
          return;
        }

        router.replace(destination as never);
        router.refresh();
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      }
    });
  };

  const createWorkspace = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startCreating(async () => {
      try {
        const slug = slugify(workspaceName);

        if (!slug) {
          setError('Please choose a workspace name.');
          return;
        }

        await apiClient.createWorkspace({
          name: workspaceName.trim(),
          slug,
        });
        router.replace(destination as never);
        router.refresh();
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      }
    });
  };

  if (onboardingQuery.isPending) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Badge>Onboarding</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Preparing your workspace
          </h1>
        </div>
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardContent className="flex flex-col gap-4 pt-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (onboardingQuery.isError || !state) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Onboarding unavailable</AlertTitle>
        <AlertDescription>{getErrorMessage(onboardingQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge>Onboarding</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Choose your workspace path
        </h1>
        <p className="max-w-4xl text-base leading-7 text-slate-300">
          Your account is the identity. Workspaces are memberships you join or create after sign-up.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Onboarding needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {state.pendingInvitations.length > 0 ? (
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle>Join invited workspace</CardTitle>
            <CardDescription>
              Invitations for {state.viewer.user.email} are shown before creating a new workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {state.pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-background/35 p-4 text-sm text-foreground md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{invitation.organizationName}</p>
                  <p className="truncate text-muted-foreground">
                    {invitation.role} invite for {invitation.email}
                  </p>
                </div>
                <Link
                  href={`/accept-invite?invitationId=${encodeURIComponent(invitation.id)}` as never}
                >
                  <Button variant="secondary">Review invite</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {state.nextStep === 'select-workspace' && organizations.length > 1 ? (
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle>Select workspace</CardTitle>
            <CardDescription>
              Pick the workspace this session should use for member management and dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-background/35 p-4 text-sm text-foreground md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{organization.name}</p>
                  <p className="truncate text-muted-foreground">{organization.slug}</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={isSelecting}
                  onClick={() => activateWorkspace(organization.id)}
                >
                  {isSelecting ? 'Activating...' : 'Use workspace'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {state.nextStep === 'select-workspace' && onlyOrganization ? (
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle>Activating workspace</CardTitle>
            <CardDescription>
              {onlyOrganization.name} is being selected for this session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled>{isSelecting ? 'Activating...' : 'Activate workspace'}</Button>
          </CardContent>
        </Card>
      ) : null}

      {state.canCreateWorkspace ? (
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle>Create workspace</CardTitle>
            <CardDescription>
              Create the first workspace only when there is no existing membership to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={createWorkspace}>
              <Input
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Acme Platform"
                required
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating workspace...' : 'Create workspace'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
