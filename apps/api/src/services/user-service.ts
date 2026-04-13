import { auth, canManageMembers, type ResolvedAuthContext } from '@acme/auth';
import type { UsersRepository } from '@acme/db';
import type { CreateInvitationInput, CurrentUserDto, UsersWorkspaceDto } from '@acme/shared';

import { AppError } from '../lib/http';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

const isBetterAuthConflict = (
  error: unknown,
  code: string,
): error is {
  statusCode?: number;
  message?: string;
  body?: {
    code?: string;
    message?: string;
  };
} => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    statusCode?: number;
    message?: string;
    body?: {
      code?: string;
      message?: string;
    };
  };

  if (candidate.body?.code === code) {
    return true;
  }

  const normalizedMessage = candidate.message?.toLowerCase();
  const normalizedBodyMessage = candidate.body?.message?.toLowerCase();

  return Boolean(
    normalizedMessage && normalizedBodyMessage && normalizedMessage.includes(normalizedBodyMessage),
  );
};

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
      canManageMembers(authContext.role)
        ? this.usersRepository.listPendingInvitations(authContext.organizationId)
        : Promise.resolve([]),
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

    if (!canManageMembers(authContext.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Only owners and admins can invite teammates into the active organization',
      );
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

      if (
        isBetterAuthConflict(error, 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION') ||
        isBetterAuthConflict(error, 'USER_ALREADY_MEMBER_OF_ORGANIZATION')
      ) {
        throw new AppError(
          409,
          'CONFLICT',
          error.body?.message ?? 'A pending invitation already exists for that email',
        );
      }

      throw error;
    }
  }
}
