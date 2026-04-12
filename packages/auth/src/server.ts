import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { loadBetterAuthEnv } from '@acme/config';
import { getDb } from '@acme/db';
import { APP_NAME } from '@acme/shared';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';

import { createAuthMailer } from './mailer';

const env = loadBetterAuthEnv(process.env);
const mailer = createAuthMailer(env);

const trustedOrigins = Array.from(
  new Set([env.BETTER_AUTH_URL, env.APP_ORIGIN, env.API_CORS_ORIGIN].filter(Boolean)),
);

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  advanced: {
    database: {
      generateId: 'uuid',
    },
    useSecureCookies: env.NODE_ENV === 'production',
  },
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    usePlural: true,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await mailer.sendPasswordReset({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await mailer.sendVerification({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  plugins: [
    nextCookies(),
    organization({
      allowUserToCreateOrganization: true,
      cancelPendingInvitationsOnReInvite: true,
      creatorRole: 'owner',
      requireEmailVerificationOnInvitation: false,
      async sendInvitationEmail({ email, inviter, invitation, organization, id }) {
        await mailer.sendInvitation({
          email,
          inviterName: inviter.user.name,
          organizationName: organization.name,
          role: invitation.role,
          url: `${env.APP_ORIGIN.replace(/\/$/, '')}/accept-invite?invitationId=${id}`,
        });
      },
    }),
  ],
});

export default auth;
