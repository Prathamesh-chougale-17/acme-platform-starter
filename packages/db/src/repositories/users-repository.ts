import { desc, eq, sql } from 'drizzle-orm';

import type { OrganizationMemberDto, PendingInvitationDto, UserDto } from '@acme/shared';

import { getDb } from '../client';
import { invitations, members, users } from '../schema';

export interface UsersRepository {
  listOrganizationMembers(organizationId: string): Promise<OrganizationMemberDto[]>;
  listPendingInvitations(organizationId: string): Promise<PendingInvitationDto[]>;
  ping(): Promise<boolean>;
}

const toUserDto = (record: typeof users.$inferSelect): UserDto => ({
  id: record.id,
  name: record.name,
  email: record.email,
  emailVerified: record.emailVerified,
  image: record.image ?? null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const parseInvitationRole = (role: string | null): PendingInvitationDto['role'] =>
  role === 'owner' || role === 'admin' ? role : 'member';

export const createUsersRepository = (): UsersRepository => ({
  async listOrganizationMembers(organizationId) {
    const database = getDb();
    const rows = await database
      .select({
        member: members,
        user: users,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.organizationId, organizationId))
      .orderBy(desc(members.createdAt));

    return rows.map(({ member, user }) => ({
      id: member.id,
      organizationId: member.organizationId,
      role: member.role === 'owner' || member.role === 'admin' ? member.role : 'member',
      createdAt: member.createdAt.toISOString(),
      user: toUserDto(user),
    }));
  },

  async listPendingInvitations(organizationId) {
    const database = getDb();
    const rows = await database
      .select()
      .from(invitations)
      .where(eq(invitations.organizationId, organizationId))
      .orderBy(desc(invitations.createdAt));

    return rows.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: parseInvitationRole(invitation.role ?? null),
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      organizationId: invitation.organizationId,
      inviterId: invitation.inviterId,
      createdAt: invitation.createdAt.toISOString(),
    }));
  },

  async ping() {
    const database = getDb();
    await database.execute(sql`select 1`);
    return true;
  },
});
