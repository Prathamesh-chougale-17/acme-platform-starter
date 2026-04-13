'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { SignUpInputSchema } from '@acme/shared';
import { Button, Input } from '@acme/ui';

import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to finish sign-up right now.';

export function SignUpForm({
  redirectTo,
  invitationId,
}: {
  redirectTo: string | undefined;
  invitationId: string | undefined;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const targetPath = useMemo(
    () => redirectTo || (invitationId ? `/accept-invite?invitationId=${invitationId}` : '/users'),
    [invitationId, redirectTo],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setNotice(null);
        const formData = new FormData(event.currentTarget);
        const organizationName = String(formData.get('organizationName') ?? '');

        startTransition(async () => {
          try {
            const payload = SignUpInputSchema.parse({
              name: formData.get('name'),
              email: formData.get('email'),
              password: formData.get('password'),
              organizationName,
              organizationSlug: slugify(organizationName),
              redirectTo: targetPath,
            });

            const { error: signUpError } = await authClient.signUp.email(payload);

            if (signUpError) {
              setError(signUpError.message ?? 'Unable to create your account.');
              return;
            }

            if (!invitationId) {
              try {
                await apiClient.createOrganization({
                  name: payload.organizationName,
                  slug: payload.organizationSlug,
                });
              } catch {
                setNotice(
                  'Your account was created, but organization provisioning needs one more retry. Continue to the workspace to finish setup.',
                );
              }
            }

            router.push(targetPath as never);
            router.refresh();
          } catch (caughtError) {
            setError(getErrorMessage(caughtError));
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="sign-up-name">
            Full name
          </label>
          <Input id="sign-up-name" name="name" placeholder="Jane Doe" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="sign-up-email">
            Work email
          </label>
          <Input
            id="sign-up-email"
            name="email"
            type="email"
            placeholder="jane@acme.com"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="sign-up-password">
          Password
        </label>
        <Input
          id="sign-up-password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
        />
      </div>
      {!invitationId ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="sign-up-organization">
            Organization name
          </label>
          <Input
            id="sign-up-organization"
            name="organizationName"
            placeholder="Acme Platform"
            required
          />
        </div>
      ) : (
        <input name="organizationName" type="hidden" value="Invited Organization" />
      )}
      {notice ? <p className="text-sm text-amber-300">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
