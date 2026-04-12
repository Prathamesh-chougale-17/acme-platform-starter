import { auth, type ResolvedAuthContext } from '@acme/auth';
import type { UsersRepository } from '@acme/db';
import type { CreateInvitationInput, CurrentUserDto, UsersWorkspaceDto } from '@acme/shared';

import { AppError } from '../lib/http';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

const toIsoString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toCurrentUserDto = (authContext: ResolvedAuthContext): CurrentUserDto => ({
  user: {
    id: authContext.user.id,
    name: authContext.user.name ?? null,
    email: authContext.user.email,
    emailVerified: authContext.user.emailVerified,
    image: authContext.user.image ?? null,
    createdAt: toIsoString(authContext.user.createdAt),
    updatedAt: toIsoString(authContext.user.updatedAt),
  },
  organization: authContext.organization,
  role: authContext.role,
});

export class UserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getCurrentUser(authContext: ResolvedAuthContext): CurrentUserDto {
    return toCurrentUserDto(authContext);
  }

  async getUsersWorkspace(authContext: ResolvedAuthContext): Promise<UsersWorkspaceDto> {
    if (!authContext.organizationId || !authContext.organization) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'An active organization is required before member data can be loaded',
      );
    }

    const [members, invitations] = await Promise.all([
      this.usersRepository.listOrganizationMembers(authContext.organizationId),
      this.usersRepository.listPendingInvitations(authContext.organizationId),
    ]);

    return {
      viewer: toCurrentUserDto(authContext),
      members,
      invitations,
    };
  }

  async createInvitation(
    authContext: ResolvedAuthContext,
    requestHeaders: Headers,
    input: CreateInvitationInput,
  ): Promise<{ invitationId: string }> {
    if (!authContext.organizationId) {
      throw new AppError(403, 'FORBIDDEN', 'An active organization is required to invite members');
    }

    try {
      const invitation = await auth.api.createInvitation({
        body: {
          ...input,
          organizationId: authContext.organizationId,
        },
        headers: requestHeaders,
      });

      return {
        invitationId: invitation.id,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'CONFLICT', 'A pending invitation already exists for that email');
      }

      throw error;
    }
  }
}
