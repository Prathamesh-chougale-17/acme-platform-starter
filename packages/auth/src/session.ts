import type { ActiveOrganizationDto, AuthRole } from '@acme/shared';
import { ActiveOrganizationDtoSchema, AuthRoleSchema } from '@acme/shared';

import { auth } from './server';

export type AuthSessionData = Awaited<ReturnType<typeof auth.api.getSession>>;

export type SessionEnvelope = NonNullable<AuthSessionData>;

export type ResolvedAuthContext = {
  session: SessionEnvelope['session'];
  user: SessionEnvelope['user'];
  organizationId: string | null;
  organization: ActiveOrganizationDto | null;
  role: AuthRole | null;
};

export class UnauthorizedAuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedAuthError';
  }
}

export class ForbiddenAuthError extends Error {
  constructor(message = 'You do not have access to this resource') {
    super(message);
    this.name = 'ForbiddenAuthError';
  }
}

const normalizeRole = (value: unknown): AuthRole | null => {
  const parsed = AuthRoleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const normalizeOrganization = (value: unknown): ActiveOrganizationDto | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate =
    'organization' in value && value.organization && typeof value.organization === 'object'
      ? value.organization
      : value;

  const parsed = ActiveOrganizationDtoSchema.safeParse({
    id: (candidate as Record<string, unknown>).id,
    name: (candidate as Record<string, unknown>).name,
    slug: (candidate as Record<string, unknown>).slug,
    logo: (candidate as Record<string, unknown>).logo ?? null,
    createdAt:
      (candidate as Record<string, unknown>).createdAt instanceof Date
        ? (candidate as { createdAt: Date }).createdAt.toISOString()
        : (candidate as Record<string, unknown>).createdAt,
    metadata:
      typeof (candidate as Record<string, unknown>).metadata === 'string'
        ? JSON.parse((candidate as { metadata: string }).metadata)
        : ((candidate as Record<string, unknown>).metadata ?? {}),
  });

  return parsed.success ? parsed.data : null;
};

export const getServerSession = async (requestHeaders: Headers): Promise<AuthSessionData> =>
  auth.api.getSession({
    headers: requestHeaders,
  });

export const resolveAuthContext = async (
  requestHeaders: Headers,
): Promise<ResolvedAuthContext | null> => {
  const sessionData = await getServerSession(requestHeaders);

  if (!sessionData) {
    return null;
  }

  const activeOrganizationId =
    (sessionData.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? null;

  const [roleResult, organizationResult] = await Promise.allSettled([
    auth.api.getActiveMemberRole({
      headers: requestHeaders,
    }),
    activeOrganizationId
      ? auth.api.getFullOrganization({
          headers: requestHeaders,
          query: {
            organizationId: activeOrganizationId,
            membersLimit: 100,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    session: sessionData.session,
    user: sessionData.user,
    organizationId: activeOrganizationId,
    organization:
      organizationResult.status === 'fulfilled'
        ? normalizeOrganization(organizationResult.value ?? null)
        : null,
    role:
      roleResult.status === 'fulfilled'
        ? normalizeRole((roleResult.value as { role?: unknown } | null)?.role)
        : null,
  };
};

export const requireSession = async (requestHeaders: Headers): Promise<ResolvedAuthContext> => {
  const context = await resolveAuthContext(requestHeaders);

  if (!context) {
    throw new UnauthorizedAuthError();
  }

  return context;
};

export const requireRole = async (
  requestHeaders: Headers,
  roles: readonly AuthRole[],
): Promise<ResolvedAuthContext> => {
  const context = await requireSession(requestHeaders);

  if (!context.role || !roles.includes(context.role)) {
    throw new ForbiddenAuthError();
  }

  return context;
};
