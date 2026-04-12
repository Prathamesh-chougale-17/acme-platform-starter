import { describe, expect, it } from 'vitest';

import { loadApiEnv } from './api';
import { loadBetterAuthEnv } from './auth';
import { loadWebEnv } from './web';

describe('config', () => {
  it('parses api env with defaults', () => {
    const env = loadApiEnv({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
    });

    expect(env.PORT).toBe(3001);
    expect(env.API_SERVICE_NAME).toBe('acme-api');
  });

  it('rejects invalid web env values', () => {
    expect(() =>
      loadWebEnv({
        NEXT_PUBLIC_API_BASE_URL: 'not-a-url',
      }),
    ).toThrowError();
  });

  it('parses better-auth env with defaults', () => {
    const env = loadBetterAuthEnv({
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      BETTER_AUTH_SECRET: '12345678901234567890123456789012',
    });

    expect(env.BETTER_AUTH_URL).toBe('http://localhost:3000');
    expect(env.AUTH_FROM_EMAIL).toContain('auth@acme-platform.local');
  });

  it('rejects missing better-auth secrets', () => {
    expect(() =>
      loadBetterAuthEnv({
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/acme_platform',
      }),
    ).toThrowError();
  });
});
