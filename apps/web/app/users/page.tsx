import { getRequiredUser } from '@/lib/auth';
import { UsersWorkspace } from '@/components/users-workspace';

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const viewer = await getRequiredUser('/users');
  const resolvedSearchParams = await (searchParams ?? Promise.resolve(undefined));
  const deniedRoute =
    resolvedSearchParams && typeof resolvedSearchParams.denied === 'string'
      ? resolvedSearchParams.denied
      : undefined;

  return <UsersWorkspace viewer={viewer} deniedRoute={deniedRoute} />;
}
