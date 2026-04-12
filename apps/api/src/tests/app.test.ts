import { loadApiEnv } from '@acme/config';
import type { UsersRepository } from '@acme/db';
import type { ApiResponse, AuthRole, CurrentUserDto, HealthDto, UsersWorkspaceDto } from '@acme/shared';
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

const authContext: {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    activeOrganizationId: string;
  };
  user: typeof authUser;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: null;
    createdAt: string;
    metadata: Record<string, never>;
  };
  role: AuthRole;
} = {
  session: {
    id: 'session-1',
    userId: authUser.id,
    expiresAt: new Date('2026-01-10T10:00:00.000Z'),
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    token: 'session-token',
    activeOrganizationId: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
  },
  user: authUser,
  organizationId: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
  organization: {
    id: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
    name: 'Acme Platform',
    slug: 'acme-platform',
    logo: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
    metadata: {},
  },
  role: 'owner',
};

let currentAuthContext = authContext;

vi.mock('@acme/auth', () => ({
  canManageMembers: (role: string | null | undefined) => role === 'owner' || role === 'admin',
  auth: {
    api: {
      createInvitation: vi.fn(async () => ({
        id: 'a079fe59-bcec-4ceb-a07b-dc0a439e0d76',
      })),
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

    if (roles && !roles.includes(currentAuthContext.role)) {
      const error = new Error('Forbidden');
      error.name = 'ForbiddenAuthError';
      throw error;
    }

    return currentAuthContext;
  }),
}));

import { createApp } from '../app';

const createRepository = (): UsersRepository => {
  const members = [
    {
      id: '4d94bf8f-b3d9-49d2-a737-932b40db673a',
      organizationId: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
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
      organizationId: '0faef1a3-1a0f-4cf6-96a0-a9382c006f17',
      inviterId: authUser.id,
      createdAt: new Date('2026-01-02T10:00:00.000Z').toISOString(),
    },
  ];

  return {
    listOrganizationMembers: vi.fn(async () => members),
    listPendingInvitations: vi.fn(async () => invitations),
    ping: vi.fn(async () => true),
  };
};

describe('api routes', () => {
  let repository: UsersRepository;

  beforeEach(() => {
    repository = createRepository();
    currentAuthContext = authContext;
  });

  it('returns health metadata', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

    const response = await app.request('/api/v1/users');
    const body = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns the authenticated users workspace envelope', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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

  it('creates invitations with validated payloads', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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

    const body = (await response.json()) as ApiResponse<{ invitationId: string }>;

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful invitation response');
    }
    expect(body.data.invitationId).toBe('a079fe59-bcec-4ceb-a07b-dc0a439e0d76');
  });

  it('hides invitation data for member-only workspaces', async () => {
    currentAuthContext = {
      ...authContext,
      role: 'member',
    };

    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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

    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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

  it('returns structured errors for the error-test route', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

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
