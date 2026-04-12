import { describe, expect, it } from 'vitest';

import { CreateUserInputSchema } from './contracts';

describe('shared contracts', () => {
  it('normalizes the create-user payload', () => {
    const result = CreateUserInputSchema.parse({
      name: 'Ada Lovelace',
      email: 'ADA@EXAMPLE.COM',
    });

    expect(result.email).toBe('ada@example.com');
  });
});
