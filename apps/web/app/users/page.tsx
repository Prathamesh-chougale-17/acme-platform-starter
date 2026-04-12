import { getRequiredUser } from '@/lib/auth';
import { UsersWorkspace } from '@/components/users-workspace';

export default async function UsersPage() {
  const viewer = await getRequiredUser('/users');

  return <UsersWorkspace viewer={viewer} />;
}
