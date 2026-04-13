import { loadApiEnv } from '@acme/config';
import type { AuditRepository, UsersRepository } from '@acme/db';
import type {
  ApiResponse,
  AuditLogListDto,
  AuthRole,
  CreateInvitationResultDto,
  CreateOrganizationResultDto,
  CurrentUserDto,
  HealthDto,
  UsersWorkspaceDto,
  AcceptInvitationResultDto,
} from '@acme/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authUser = {
  id: '4d94bf8f-b3d9-49d2-a737-932b40db673a',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-01T10:00:00.000Z'),
};

const baseOrganization = {
  id: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
  name: 'Acme Platform',
  slug: 'acme-platform',
  logo: null,
  createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
  metadata: {},
};

type MockAuthContext = {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    activeOrganizationId: string | null;
  };
  user: typeof authUser;
  organizationId: string | null;
  organization: typeof baseOrganization | null;
  role: AuthRole | null;
};

const authContext: MockAuthContext = {
  session: {
    id: 'session-1',
    userId: authUser.id,
    expiresAt: new Date('2026-01-10T10:00:00.000Z'),
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    token: 'session-token',
    activeOrganizationId: baseOrganization.id,
  },
  user: authUser,
  organizationId: baseOrganization.id,
  organization: baseOrganization,
  role: 'owner',
};

let currentAuthContext = authContext;
const { createInvitationMock, createOrganizationMock, acceptInvitationMock } = vi.hoisted(() => ({
  createInvitationMock: vi.fn(async () => ({
    id: 'a079fe59-bcec-4ceb-a07b-dc0a439e0d76',
  })),
  createOrganizationMock: vi.fn(async () => ({
    id: '58e7783f-8921-4dd3-81ed-cb82f37c1cd2',
  })),
  acceptInvitationMock: vi.fn(async () => ({
    id: '6a9d0f58-286f-4f69-9dd1-a8f44f1546f0',
  })),
}));

vi.mock('@acme/auth', () => ({
  canManageMembers: (role: string | null | undefined) => role === 'owner' || role === 'admin',
  auth: {
    api: {
      acceptInvitation: acceptInvitationMock,
      createInvitation: createInvitationMock,
      createOrganization: createOrganizationMock,
    },
  },
  resolveAuthContext: vi.fn(async (headers: Headers) =>
    headers.get('cookie')?.includes('session=valid') ? currentAuthContext : null,
  ),
  requireSession: vi.fn(async (headers: Headers) => {
    if (!headers.get('cookie')?.includes('session=valid')) {
      const error = new Error('Authentication required');
      error.name = 'UnauthorizedAuthError';
      throw error;
    }

    return currentAuthContext;
  }),
  requireRole: vi.fn(async (headers: Headers, roles?: readonly string[]) => {
    if (!headers.get('cookie')?.includes('session=valid')) {
      const error = new Error('Authentication required');
      error.name = 'UnauthorizedAuthError';
      throw error;
    }

    if (roles && (!currentAuthContext.role || !roles.includes(currentAuthContext.role))) {
      const error = new Error('Forbidden');
      error.name = 'ForbiddenAuthError';
      throw error;
    }

    return currentAuthContext;
  }),
}));

import { createApp } from '../app';

const createRepositories = (): {
  auditRepository: AuditRepository;
  usersRepository: UsersRepository;
} => {
  const members = [
    {
      id: '4d94bf8f-b3d9-49d2-a737-932b40db673a',
      organizationId: baseOrganization.id,
      role: 'owner' as const,
      createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        image: authUser.image,
        createdAt: authUser.createdAt.toISOString(),
        updatedAt: authUser.updatedAt.toISOString(),
      },
    },
  ];
  const invitations = [
    {
      id: '6a9d0f58-286f-4f69-9dd1-a8f44f1546f0',
      email: 'grace@example.com',
      role: 'member' as const,
      status: 'pending',
      expiresAt: new Date('2026-01-03T10:00:00.000Z').toISOString(),
      organizationId: baseOrganization.id,
      inviterId: authUser.id,
      createdAt: new Date('2026-01-02T10:00:00.000Z').toISOString(),
    },
  ];
  const auditLogs: AuditLogListDto = {
    items: [
      {
        id: '1e32e508-867e-48ca-94a4-2a3b304913a3',
        organizationId: baseOrganization.id,
        eventType: 'invitation.created',
        actor: {
          userId: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: 'owner',
        },
        targetUserId: null,
        targetEmail: 'grace@example.com',
        targetInvitationId: invitations[0]!.id,
        requestId: 'request-1',
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
        metadata: {
          invitedRole: 'member',
        },
        createdAt: new Date('2026-01-02T10:00:00.000Z').toISOString(),
      },
    ],
  };

  return {
    usersRepository: {
      findInvitationById: vi.fn(async (invitationId: string) =>
        invitationId === invitations[0]!.id
          ? {
              id: invitations[0]!.id,
              organizationId: invitations[0]!.organizationId,
              email: invitations[0]!.email,
              role: invitations[0]!.role,
              inviterId: invitations[0]!.inviterId!,
            }
          : null,
      ),
      listOrganizationMembers: vi.fn(async () => members),
      listPendingInvitations: vi.fn(async () => invitations),
      ping: vi.fn(async () => true),
    },
    auditRepository: {
      appendAuditLog: vi.fn(async () => undefined),
      listOrganizationAuditLogs: vi.fn(async () => auditLogs),
    },
  };
};

const createTestApp = (repositories: {
  auditRepository: AuditRepository;
  usersRepository: UsersRepository;
}) =>
  createApp({
    env: loadApiEnv({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
    }),
    auditRepository: repositories.auditRepository,
    usersRepository: repositories.usersRepository,
  });

describe('api routes', () => {
  let repositories: {
    auditRepository: AuditRepository;
    usersRepository: UsersRepository;
  };

  beforeEach(() => {
    repositories = createRepositories();
    currentAuthContext = authContext;
    createInvitationMock.mockReset();
    createInvitationMock.mockResolvedValue({
      id: 'a079fe59-bcec-4ceb-a07b-dc0a439e0d76',
    });
    createOrganizationMock.mockReset();
    createOrganizationMock.mockResolvedValue({
      id: '58e7783f-8921-4dd3-81ed-cb82f37c1cd2',
    });
    acceptInvitationMock.mockReset();
    acceptInvitationMock.mockResolvedValue({
      id: '6a9d0f58-286f-4f69-9dd1-a8f44f1546f0',
    });
  });

  it('returns health metadata', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/health');
    const body = (await response.json()) as ApiResponse<HealthDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful health response');
    }
    expect(body.data.service).toBe('acme-api');
  });

  it('rejects unauthenticated access to the users workspace', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/users');
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns the authenticated users workspace envelope', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/users', {
      headers: {
        cookie: 'session=valid',
      },
    });
    const body = (await response.json()) as ApiResponse<UsersWorkspaceDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful users workspace response');
    }
    expect(body.data.members).toHaveLength(1);
    expect(body.data.viewer.user.email).toBe('ada@example.com');
  });

  it('returns the current user summary for authenticated requests', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/me', {
      headers: {
        cookie: 'session=valid',
      },
    });

    const body = (await response.json()) as ApiResponse<CurrentUserDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful current-user response');
    }
    expect(body.data.role).toBe('owner');
  });

  it('creates invitations with validated payloads and appends an audit log', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/invitations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'session=valid',
      },
      body: JSON.stringify({
        email: 'grace@example.com',
        role: 'member',
      }),
    });

    const body = (await response.json()) as ApiResponse<CreateInvitationResultDto>;

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful invitation response');
    }
    expect(body.data.invitationId).toBe('a079fe59-bcec-4ceb-a07b-dc0a439e0d76');
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledTimes(1);
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'invitation.created',
        organizationId: baseOrganization.id,
        targetEmail: 'grace@example.com',
      }),
    );
  });

  it('creates organizations through the server-owned endpoint and appends an audit log', async () => {
    currentAuthContext = {
      ...authContext,
      organizationId: null,
      organization: null,
      role: null,
      session: {
        ...authContext.session,
        activeOrganizationId: null,
      },
    };
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/organizations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'session=valid',
      },
      body: JSON.stringify({
        name: 'New Org',
        slug: 'new-org',
      }),
    });

    const body = (await response.json()) as ApiResponse<CreateOrganizationResultDto>;

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful organization response');
    }
    expect(body.data.organizationId).toBe('58e7783f-8921-4dd3-81ed-cb82f37c1cd2');
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledTimes(1);
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'organization.created',
        organizationId: '58e7783f-8921-4dd3-81ed-cb82f37c1cd2',
      }),
    );
  });

  it('accepts invitations through the server-owned endpoint and appends an audit log', async () => {
    currentAuthContext = {
      ...authContext,
      organizationId: null,
      organization: null,
      role: null,
      session: {
        ...authContext.session,
        activeOrganizationId: null,
      },
    };
    const app = createTestApp(repositories);

    const response = await app.request(
      '/api/v1/invitations/6a9d0f58-286f-4f69-9dd1-a8f44f1546f0/accept',
      {
        method: 'POST',
        headers: {
          cookie: 'session=valid',
        },
      },
    );

    const body = (await response.json()) as ApiResponse<AcceptInvitationResultDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful invitation acceptance response');
    }
    expect(body.data.organizationId).toBe(baseOrganization.id);
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledTimes(1);
    expect(repositories.auditRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'invitation.accepted',
        organizationId: baseOrganization.id,
        targetEmail: 'grace@example.com',
      }),
    );
  });

  it('returns a conflict when Better Auth reports an existing invitation without writing an audit row', async () => {
    createInvitationMock.mockRejectedValueOnce({
      message: 'User is already invited to this organization',
      statusCode: 400,
      body: {
        code: 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION',
        message: 'User is already invited to this organization',
      },
    });

    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/invitations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'session=valid',
      },
      body: JSON.stringify({
        email: 'grace@example.com',
        role: 'member',
      }),
    });
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(repositories.auditRepository.appendAuditLog).not.toHaveBeenCalled();
    if (body.success) {
      throw new Error('Expected an error response');
    }
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toBe('User is already invited to this organization');
  });

  it('returns newest-first audit logs for owners and admins', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/audit-logs?limit=25', {
      headers: {
        cookie: 'session=valid',
      },
    });
    const body = (await response.json()) as ApiResponse<AuditLogListDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful audit response');
    }
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]?.eventType).toBe('invitation.created');
    expect(repositories.auditRepository.listOrganizationAuditLogs).toHaveBeenCalledWith(
      baseOrganization.id,
      25,
    );
  });

  it('hides invitation data for member-only workspaces', async () => {
    currentAuthContext = {
      ...authContext,
      role: 'member',
    };

    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/users', {
      headers: {
        cookie: 'session=valid',
      },
    });
    const body = (await response.json()) as ApiResponse<UsersWorkspaceDto>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful users workspace response');
    }
    expect(body.data.viewer.role).toBe('member');
    expect(body.data.invitations).toHaveLength(0);
  });

  it('rejects invitation creation for member workspaces', async () => {
    currentAuthContext = {
      ...authContext,
      role: 'member',
    };

    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/invitations', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'session=valid',
      },
      body: JSON.stringify({
        email: 'grace@example.com',
        role: 'member',
      }),
    });
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('rejects audit log access for member workspaces', async () => {
    currentAuthContext = {
      ...authContext,
      role: 'member',
    };

    const app = createTestApp(repositories);
    const response = await app.request('/api/v1/audit-logs?limit=25', {
      headers: {
        cookie: 'session=valid',
      },
    });
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('returns structured errors for the error-test route', async () => {
    const app = createTestApp(repositories);

    const response = await app.request('/api/v1/error-test');
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    if (body.success) {
      throw new Error('Expected an error response');
    }
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
