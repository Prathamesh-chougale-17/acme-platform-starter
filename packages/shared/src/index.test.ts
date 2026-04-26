import { describe, expect, it } from 'vitest';

import { AccountSignUpInputSchema, CreateInvitationInputSchema, UserDtoSchema } from './contracts';

describe('shared contracts', () => {
  it('normalizes the sign-up payload', () => {
    const result = AccountSignUpInputSchema.parse({
      name: 'Ada Lovelace',
      email: 'ADA@EXAMPLE.COM',
      password: 'super-secure-password',
    });

    expect(result.email).toBe('ada@example.com');
  });

  it('normalizes invitation payloads', () => {
    const result = CreateInvitationInputSchema.parse({
      email: 'INVITED@EXAMPLE.COM',
      role: 'admin',
    });

    expect(result.email).toBe('invited@example.com');
    expect(result.role).toBe('admin');
  });

  it('supports nullable auth profile fields', () => {
    const result = UserDtoSchema.parse({
      id: crypto.randomUUID(),
      name: null,
      email: 'member@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
  });
});
