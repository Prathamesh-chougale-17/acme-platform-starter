import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { getCurrentUser } from '@/lib/auth';

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const [currentUser, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams ?? Promise.resolve(undefined),
  ]);
  const redirectTo =
    resolvedSearchParams && typeof resolvedSearchParams.redirectTo === 'string'
      ? resolvedSearchParams.redirectTo
      : undefined;

  if (currentUser) {
    redirect('/users');
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title="Sign in to your workspace"
      description="Use your account session to access the organization workspace, operational dashboards, and member management APIs."
      alternateHref="/sign-up"
      alternateLabel="Need an account? Create one"
    >
      <SignInForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
