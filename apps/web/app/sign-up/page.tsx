import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { getCurrentUser } from '@/lib/auth';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string; invitationId?: string }>;
}) {
  const [currentUser, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const redirectTo =
    resolvedSearchParams && typeof resolvedSearchParams.redirectTo === 'string'
      ? resolvedSearchParams.redirectTo
      : undefined;
  const invitationId =
    resolvedSearchParams && typeof resolvedSearchParams.invitationId === 'string'
      ? resolvedSearchParams.invitationId
      : undefined;

  if (currentUser) {
    redirect('/users');
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title="Create your platform account"
      description="Self-serve sign-up provisions the first organization. Invitation-based onboarding reuses the same account flow and joins the invited workspace."
      alternateHref="/sign-in"
      alternateLabel="Already have an account? Sign in"
    >
      <SignUpForm redirectTo={redirectTo} invitationId={invitationId} />
    </AuthShell>
  );
}
