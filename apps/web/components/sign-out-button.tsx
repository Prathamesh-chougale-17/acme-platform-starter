'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@acme/ui';

import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();
          router.push('/');
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
