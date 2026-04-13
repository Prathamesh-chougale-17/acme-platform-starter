'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@acme/ui';

import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to accept the invitation right now.';

type InvitationSummary = {
  email: string | undefined;
  organizationName: string | undefined;
  role: string | undefined;
};

type InvitationLookupResponse = {
  data:
    | {
        email?: string;
        organizationName?: string;
        role?: string;
      }
    | null
    | undefined;
  error?: {
    message?: string;
  } | null;
};

export function AcceptInvitePanel({
  invitationId,
  isAuthenticated,
}: {
  invitationId: string | undefined;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InvitationSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!invitationId) {
      return;
    }

    void (async () => {
      try {
        const response = (await authClient.organization.getInvitation({
          query: {
            id: invitationId,
          },
        })) as InvitationLookupResponse;

        if (response.error) {
          setError(response.error.message ?? 'Unable to load invitation details.');
          return;
        }

        if (response.data) {
          setSummary({
            email: response.data.email,
            organizationName: response.data.organizationName,
            role: response.data.role,
          });
        }
      } catch (caughtError: unknown) {
        setError(getErrorMessage(caughtError));
      }
    })();
  }, [invitationId]);

  if (!invitationId) {
    return <p className="text-sm text-rose-300">Invitation id missing from the URL.</p>;
  }

  if (!isAuthenticated) {
    const redirectTo = `/accept-invite?invitationId=${encodeURIComponent(invitationId)}`;

    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">
          Sign in or create an account with the invited email address before accepting this
          invitation.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` as never}>
            <Button>Sign in to continue</Button>
          </Link>
          <Link
            href={
              `/sign-up?redirectTo=${encodeURIComponent(redirectTo)}&invitationId=${encodeURIComponent(invitationId)}` as never
            }
          >
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">{summary.organizationName ?? 'Invitation'}</p>
          <p className="mt-2">Invitee: {summary.email ?? 'Unknown email'}</p>
          <p className="mt-1">Role: {summary.role ?? 'member'}</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await apiClient.acceptInvitation(invitationId);
              router.push('/users' as never);
              router.refresh();
            } catch (caughtError) {
              setError(getErrorMessage(caughtError));
            }
          });
        }}
      >
        {isPending ? 'Accepting invitation...' : 'Accept invitation'}
      </Button>
    </div>
  );
}
