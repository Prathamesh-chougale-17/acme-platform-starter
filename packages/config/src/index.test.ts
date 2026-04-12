import { describe, expect, it } from 'vitest';

import { loadApiEnv } from './api';
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
});
