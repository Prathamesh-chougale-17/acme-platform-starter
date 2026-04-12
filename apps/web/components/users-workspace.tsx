'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Badge, Button, Card, CardDescription, CardTitle, Input } from '@acme/ui';
import type { CreateInvitationInput, CurrentUserDto } from '@acme/shared';

import { authClient } from '@/lib/auth-client';
import { useCreateInvitationMutation, useUsersWorkspaceQuery } from '@/lib/queries';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to complete the request';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export function UsersWorkspace({ viewer }: { viewer: CurrentUserDto }) {
  const router = useRouter();
  const [inviteForm, setInviteForm] = useState<CreateInvitationInput>({
    email: '',
    role: 'member',
  });
  const [organizationName, setOrganizationName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isProvisioning, startProvisioning] = useTransition();
  const workspaceQuery = useUsersWorkspaceQuery();
  const createInvitationMutation = useCreateInvitationMutation();

  const workspace = workspaceQuery.data;
  const effectiveViewer = workspace?.viewer ?? viewer;
  const members = workspace?.members ?? [];
  const invitations = workspace?.invitations ?? [];
  const errorMessage = createInvitationMutation.isError
    ? getErrorMessage(createInvitationMutation.error)
    : workspaceQuery.isError
      ? getErrorMessage(workspaceQuery.error)
      : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    try {
      await createInvitationMutation.mutateAsync(inviteForm);
      setInviteForm({ email: '', role: 'member' });
      setNotice(`Invitation queued for ${inviteForm.email}`);
    } catch {
      // Mutation state drives the error message UI.
    }
  };

  if (!effectiveViewer.organization) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Badge>Organization Setup</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Finish your workspace setup
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-300">
            Your account is ready. Create the first organization to unlock member management,
            operational dashboards, and role-aware API access.
          </p>
        </div>

        <Card className="max-w-2xl space-y-4">
          <CardTitle>Create your first organization</CardTitle>
          <CardDescription>
            This only runs once for your account unless you create additional orgs later.
          </CardDescription>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSetupError(null);
              startProvisioning(async () => {
                const slug = slugify(organizationName);

                if (!slug) {
                  setSetupError('Please choose an organization name.');
                  return;
                }

                const organizationResponse = (await authClient.organization.create({
                  name: organizationName,
                  slug,
                })) as {
                  error?: {
                    message?: string;
                  } | null;
                };
                const error = organizationResponse.error;

                if (error) {
                  setSetupError(error.message ?? 'Unable to create the organization.');
                  return;
                }

                router.refresh();
              });
            }}
          >
            <Input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Acme Platform"
              required
            />
            {setupError ? <p className="text-sm text-rose-300">{setupError}</p> : null}
            <Button disabled={isProvisioning}>
              {isProvisioning ? 'Provisioning organization...' : 'Create organization'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge>Organization Members</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Invite and manage teammates
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Active organization: {effectiveViewer.organization.name}. The same session and role data
          are consumed by Next.js, Better Auth, and the Hono API.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <Card className="space-y-4">
          <CardTitle>Invite a teammate</CardTitle>
          <CardDescription>
            Owner and admin roles can invite members into the active organization.
          </CardDescription>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              placeholder="jane@example.com"
              type="email"
              value={inviteForm.email}
              onChange={(event) =>
                setInviteForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <select
              className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
              value={inviteForm.role}
              onChange={(event) =>
                setInviteForm((current) => ({
                  ...current,
                  role: event.target.value as CreateInvitationInput['role'],
                }))
              }
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button className="w-full" disabled={createInvitationMutation.isPending}>
              {createInvitationMutation.isPending ? 'Sending invitation...' : 'Send invitation'}
            </Button>
          </form>
          {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
        </Card>

        <Card className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>Loaded from the protected Hono service layer.</CardDescription>
            </div>
            <Button variant="secondary" onClick={() => void workspaceQuery.refetch()}>
              {workspaceQuery.isFetching && !workspaceQuery.isPending ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {workspaceQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : workspaceQuery.isError ? (
            <p className="text-sm text-rose-300">{getErrorMessage(workspaceQuery.error)}</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-300">
              No members yet. Invite the first teammate from the form.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {member.user.name ?? member.user.email}
                      </p>
                      <p className="text-slate-300">{member.user.email}</p>
                    </div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4 lg:col-span-2">
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>These links are delivered by the shared auth mailer.</CardDescription>
          {invitations.length === 0 ? (
            <p className="text-sm text-slate-300">No pending invitations for this organization.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{invitation.email}</p>
                      <p className="text-slate-300">
                        Expires {new Date(invitation.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
                      {invitation.role}
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
