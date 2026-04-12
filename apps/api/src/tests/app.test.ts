import { loadApiEnv } from '@acme/config';
import type { UsersRepository } from '@acme/db';
import type { ApiResponse, HealthDto, UserDto } from '@acme/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app';

const createRepository = (): UsersRepository => {
  const rows = [
    {
      id: '4d94bf8f-b3d9-49d2-a737-932b40db673a',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
    },
  ];

  return {
    listUsers: vi.fn(async () => rows),
    createUser: vi.fn(async (input) => {
      const created = {
        id: 'c82151dc-fb8e-4849-a5b3-2682869d8562',
        name: input.name,
        email: input.email,
        createdAt: new Date('2026-01-02T10:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-01-02T10:00:00.000Z').toISOString(),
      };

      rows.unshift(created);
      return created;
    }),
    ping: vi.fn(async () => true),
  };
};

describe('api routes', () => {
  let repository: UsersRepository;

  beforeEach(() => {
    repository = createRepository();
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

  it('lists users in the standard response envelope', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

    const response = await app.request('/api/v1/users');
    const body = (await response.json()) as ApiResponse<UserDto[]>;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful users response');
    }
    expect(body.data).toHaveLength(1);
  });

  it('creates a user with validated payloads', async () => {
    const app = createApp({
      env: loadApiEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
      usersRepository: repository,
    });

    const response = await app.request('/api/v1/users', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Grace Hopper',
        email: 'grace@example.com',
      }),
    });

    const body = (await response.json()) as ApiResponse<UserDto>;

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    if (!body.success) {
      throw new Error('Expected a successful create-user response');
    }
    expect(body.data.email).toBe('grace@example.com');
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
