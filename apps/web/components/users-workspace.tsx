'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from '@acme/ui';
import type { AuthRole, CreateInvitationInput, CurrentUserDto } from '@acme/shared';

import { authClient } from '@/lib/auth-client';
import { ApiClientError } from '@/lib/api-client';
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

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const memberRoleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
};

const canManageMembers = (role: AuthRole | null | undefined) =>
  role === 'owner' || role === 'admin';

export function UsersWorkspace({
  viewer,
  deniedRoute,
}: {
  viewer: CurrentUserDto;
  deniedRoute?: string | undefined;
}) {
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
  const canInviteMembers = canManageMembers(effectiveViewer.role);
  const errorMessage = createInvitationMutation.isError
    ? getErrorMessage(createInvitationMutation.error)
    : workspaceQuery.isError
      ? getErrorMessage(workspaceQuery.error)
      : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const submittedInvite = { ...inviteForm };

    try {
      await createInvitationMutation.mutateAsync(submittedInvite);
      setInviteForm({ email: '', role: 'member' });
      setNotice(`Invitation queued for ${submittedInvite.email}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'REQUEST_TIMEOUT') {
        const refreshedWorkspace = await workspaceQuery.refetch();
        const invitationWasCreated = refreshedWorkspace.data?.invitations.some(
          (invitation) => invitation.email === submittedInvite.email,
        );

        if (invitationWasCreated) {
          setInviteForm({ email: '', role: 'member' });
          setNotice(
            `Invitation queued for ${submittedInvite.email}. Delivery took longer than the browser wait, but the pending invite was created successfully.`,
          );
        }
      }
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

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create your first organization</CardTitle>
            <CardDescription>
              This only runs once for your account unless you create additional orgs later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
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
              {setupError ? (
                <Alert variant="destructive">
                  <AlertTitle>Organization setup failed</AlertTitle>
                  <AlertDescription>{setupError}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" disabled={isProvisioning}>
                {isProvisioning ? 'Provisioning organization...' : 'Create organization'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge>Organization Members</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          {canInviteMembers ? 'Invite and manage teammates' : 'View organization teammates'}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Active organization: {effectiveViewer.organization.name}. The same session and role data
          are consumed by Next.js, Better Auth, and the Hono API.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={memberRoleVariant[effectiveViewer.role ?? 'member'] ?? 'outline'}>
            {effectiveViewer.role ?? 'member'}
          </Badge>
          <span className="text-sm text-slate-400">
            {canInviteMembers
              ? 'This workspace can invite teammates and access operational dashboards.'
              : 'This workspace is read-only for member management and cannot access operational dashboards.'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{canInviteMembers ? 'Invite a teammate' : 'Role-aware workspace'}</CardTitle>
            <CardDescription>
              {canInviteMembers
                ? 'Owner and admin roles can invite members into the active organization.'
                : 'Owners and admins can invite teammates. Members can browse the current organization only.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {deniedRoute ? (
              <Alert variant="destructive">
                <AlertTitle>Access denied for {deniedRoute}</AlertTitle>
                <AlertDescription>
                  Your current workspace role is <strong>{effectiveViewer.role ?? 'member'}</strong>{' '}
                  in <strong>{effectiveViewer.organization.name}</strong>. Switch the active
                  workspace if you need an organization where you are an owner or admin.
                </AlertDescription>
              </Alert>
            ) : null}
            {canInviteMembers ? (
              <>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <Input
                    placeholder="jane@example.com"
                    type="email"
                    value={inviteForm.email}
                    onChange={(event) =>
                      setInviteForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) =>
                      setInviteForm((current) => ({
                        ...current,
                        role: value as CreateInvitationInput['role'],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createInvitationMutation.isPending}
                  >
                    {createInvitationMutation.isPending
                      ? 'Sending invitation...'
                      : 'Send invitation'}
                  </Button>
                </form>
                {notice ? (
                  <Alert>
                    <AlertTitle>Invitation queued</AlertTitle>
                    <AlertDescription>{notice}</AlertDescription>
                  </Alert>
                ) : null}
                {errorMessage ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to send invitation</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                ) : null}
              </>
            ) : (
              <Alert>
                <AlertTitle>Member access is active</AlertTitle>
                <AlertDescription>
                  This account can view teammates in the active organization, but invitation
                  management and operational dashboards are reserved for owners and admins.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardAction>
              <Button variant="secondary" onClick={() => void workspaceQuery.refetch()}>
                {workspaceQuery.isFetching && !workspaceQuery.isPending
                  ? 'Refreshing...'
                  : 'Refresh'}
              </Button>
            </CardAction>
            <CardDescription>Loaded from the protected Hono service layer.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {workspaceQuery.isPending ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </>
            ) : workspaceQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load members</AlertTitle>
                <AlertDescription>{getErrorMessage(workspaceQuery.error)}</AlertDescription>
              </Alert>
            ) : members.length === 0 ? (
              <Alert>
                <AlertTitle>No members yet</AlertTitle>
                <AlertDescription>
                  Invite the first teammate from the form to start building inside this
                  organization.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {members.map((member, index) => (
                  <div key={member.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 rounded-3xl border border-border/80 bg-background/35 p-4 text-sm text-foreground">
                      <Avatar size="lg">
                        <AvatarFallback>
                          {getInitials(member.user.name ?? member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {member.user.name ?? member.user.email}
                        </p>
                        <p className="truncate text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant={memberRoleVariant[member.role] ?? 'outline'}>
                        {member.role}
                      </Badge>
                    </div>
                    {index < members.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>These links are delivered by the shared auth mailer.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {canInviteMembers ? (
              invitations.length === 0 ? (
                <Alert>
                  <AlertTitle>No pending invitations</AlertTitle>
                  <AlertDescription>
                    New invites will appear here until they are accepted or expire.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {invitations.map((invitation, index) => (
                    <div key={invitation.id} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/80 bg-background/35 p-4 text-sm text-foreground">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{invitation.email}</p>
                          <p className="text-muted-foreground">
                            Expires {new Date(invitation.expiresAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={invitation.role === 'admin' ? 'secondary' : 'outline'}>
                          {invitation.role}
                        </Badge>
                      </div>
                      {index < invitations.length - 1 ? <Separator /> : null}
                    </div>
                  ))}
                </>
              )
            ) : (
              <Alert>
                <AlertTitle>Invitation visibility is restricted</AlertTitle>
                <AlertDescription>
                  Owners and admins can review pending invitations for the active organization.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
