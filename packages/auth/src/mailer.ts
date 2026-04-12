import { Resend } from 'resend';

import type { BetterAuthEnv } from '@acme/config';
import { APP_NAME } from '@acme/shared';

type AuthEmailType = 'invitation' | 'password-reset' | 'verification';

export type AuthEmailRecord = {
  type: AuthEmailType;
  to: string;
  subject: string;
  html: string;
  text: string;
};

const capturedEmails: AuthEmailRecord[] = [];

const recordCapturedEmail = (email: AuthEmailRecord) => {
  capturedEmails.push(email);
};

const createResendClient = (apiKey?: string) => (apiKey ? new Resend(apiKey) : undefined);

const sanitizeRecipient = (to: string) => to.trim().toLowerCase();

const supportCopy = 'If you did not request this email, you can safely ignore it.';

const renderShell = (title: string, intro: string, actionLabel: string, actionUrl: string) => {
  const escapedUrl = actionUrl.replace(/"/g, '&quot;');

  return {
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #0891b2;">
          ${APP_NAME}
        </p>
        <h1 style="font-size: 28px; margin-bottom: 12px;">${title}</h1>
        <p style="margin-bottom: 16px;">${intro}</p>
        <p style="margin: 24px 0;">
          <a
            href="${escapedUrl}"
            style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #06b6d4; color: #082f49; text-decoration: none; font-weight: 700;"
          >
            ${actionLabel}
          </a>
        </p>
        <p style="word-break: break-all; color: #475569;">${actionUrl}</p>
        <p style="margin-top: 24px; color: #64748b;">${supportCopy}</p>
      </div>
    `.trim(),
    text: `${APP_NAME}\n\n${title}\n\n${intro}\n\n${actionLabel}: ${actionUrl}\n\n${supportCopy}`,
  };
};

const dispatchEmail = async (
  env: BetterAuthEnv,
  email: AuthEmailRecord,
): Promise<{ provider: 'resend' | 'capture' }> => {
  const resend = createResendClient(env.RESEND_API_KEY);

  if (!resend || env.NODE_ENV === 'test') {
    recordCapturedEmail(email);
    console.info(`[auth-email:${email.type}] ${email.to}`);
    return { provider: 'capture' };
  }

  await resend.emails.send({
    from: env.AUTH_FROM_EMAIL,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  return { provider: 'resend' };
};

export const clearCapturedAuthEmails = () => {
  capturedEmails.length = 0;
};

export const getCapturedAuthEmails = () => [...capturedEmails];

export const createAuthMailer = (env: BetterAuthEnv) => ({
  async sendPasswordReset(input: { email: string; name?: string | null; url: string }) {
    const content = renderShell(
      'Reset your password',
      `A password reset was requested${input.name ? ` for ${input.name}` : ''}.`,
      'Reset password',
      input.url,
    );

    await dispatchEmail(env, {
      type: 'password-reset',
      to: sanitizeRecipient(input.email),
      subject: `${APP_NAME}: reset your password`,
      ...content,
    });
  },

  async sendVerification(input: { email: string; name?: string | null; url: string }) {
    const content = renderShell(
      'Verify your email address',
      `Confirm this address${input.name ? ` for ${input.name}` : ''} so teammates can trust your access.`,
      'Verify email',
      input.url,
    );

    await dispatchEmail(env, {
      type: 'verification',
      to: sanitizeRecipient(input.email),
      subject: `${APP_NAME}: verify your email`,
      ...content,
    });
  },

  async sendInvitation(input: {
    email: string;
    inviterName?: string | null;
    organizationName: string;
    role: string;
    url: string;
  }) {
    const content = renderShell(
      `Join ${input.organizationName}`,
      `${input.inviterName ?? 'A teammate'} invited you to join ${input.organizationName} as ${input.role}. Sign in or create an account, then accept the invitation.`,
      'Review invitation',
      input.url,
    );

    await dispatchEmail(env, {
      type: 'invitation',
      to: sanitizeRecipient(input.email),
      subject: `${APP_NAME}: invitation to ${input.organizationName}`,
      ...content,
    });
  },
});
