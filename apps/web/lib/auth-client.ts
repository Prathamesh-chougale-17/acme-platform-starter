'use client';

import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

// Better Auth's inferred client type currently expands through internal module paths.
type AsyncClientMethod = (...args: unknown[]) => Promise<unknown>;

export const authClient = createAuthClient({
  plugins: [organizationClient()],
}) as unknown as ReturnType<typeof createAuthClient> & {
  organization: {
    create: AsyncClientMethod;
    acceptInvitation: AsyncClientMethod;
    getInvitation: AsyncClientMethod;
  };
  requestPasswordReset: AsyncClientMethod;
  resetPassword: AsyncClientMethod;
};
