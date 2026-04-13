import { aliasedTable, desc, eq, sql } from 'drizzle-orm';

import type { AuthRole, OrganizationMemberDto, PendingInvitationDto, UserDto } from '@acme/shared';

import { getDb } from '../client';
import { invitations, members, organizations, users } from '../schema';

export interface UsersRepository {
  listOrganizationMembers(organizationId: string): Promise<OrganizationMemberDto[]>;
  listPendingInvitations(organizationId: string): Promise<PendingInvitationDto[]>;
  findInvitationById(invitationId: string): Promise<InvitationAuditTarget | null>;
  ping(): Promise<boolean>;
}

export type InvitationAuditTarget = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: AuthRole;
  status: string;
  inviterId: string;
  inviterName: string | null;
  expiresAt: string;
};

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

  async findInvitationById(invitationId) {
    const database = getDb();
    const inviterUsers = aliasedTable(users, 'inviter_users');
    const [invitation] = await database
      .select({
        invitation: invitations,
        organization: {
          name: organizations.name,
        },
        inviter: {
          name: inviterUsers.name,
        },
      })
      .from(invitations)
      .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
      .leftJoin(inviterUsers, eq(invitations.inviterId, inviterUsers.id))
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      return null;
    }

    return {
      id: invitation.invitation.id,
      organizationId: invitation.invitation.organizationId,
      organizationName: invitation.organization.name,
      email: invitation.invitation.email,
      role: parseInvitationRole(invitation.invitation.role ?? null),
      status: invitation.invitation.status,
      inviterId: invitation.invitation.inviterId,
      inviterName: invitation.inviter?.name ?? null,
      expiresAt: invitation.invitation.expiresAt.toISOString(),
    };
  },

  async ping() {
    const database = getDb();
    await database.execute(sql`select 1`);
    return true;
  },
});
