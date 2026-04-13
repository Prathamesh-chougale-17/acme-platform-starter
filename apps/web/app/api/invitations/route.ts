import { auth, canManageMembers, requireRole } from '@acme/auth';
import { createAuditRepository } from '@acme/db';
import { CreateInvitationInputSchema, success, failure, type CreateInvitationResultDto } from '@acme/shared';

const auditRepository = createAuditRepository();

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

const isBetterAuthConflict = (
  error: unknown,
  code: string,
): error is {
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

const getClientIpAddress = (headers: Headers): string | null => {
  const forwardedFor = headers.get('x-forwarded-for');

  if (forwardedFor) {
    const [firstAddress] = forwardedFor
      .split(',')
      .map((candidate) => candidate.trim())
      .filter(Boolean);

    if (firstAddress) {
      return firstAddress;
    }
  }

  return headers.get('cf-connecting-ip') ?? headers.get('x-real-ip') ?? null;
};

const createMeta = (requestId: string) => ({
  requestId,
});

const jsonSuccess = (requestId: string, statusCode: number, data: CreateInvitationResultDto) =>
  Response.json(success(data, createMeta(requestId)), {
    status: statusCode,
    headers: {
      'x-request-id': requestId,
    },
  });

const jsonFailure = (
  requestId: string,
  statusCode: number,
  code: 'BAD_REQUEST' | 'CONFLICT' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'VALIDATION_ERROR',
  message: string,
  details?: unknown,
) =>
  Response.json(
    failure(
      {
        code,
        message,
        details,
      },
      createMeta(requestId),
    ),
    {
      status: statusCode,
      headers: {
        'x-request-id': requestId,
      },
    },
  );

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);

  try {
    const authContext = await requireRole(requestHeaders, ['owner', 'admin']);

    if (!authContext.organizationId || !canManageMembers(authContext.role)) {
      return jsonFailure(
        requestId,
        403,
        'FORBIDDEN',
        'Only owners and admins can invite teammates into the active organization',
      );
    }

    const body = await request.json();
    const payload = CreateInvitationInputSchema.parse(body);
    const invitation = await auth.api.createInvitation({
      body: {
        ...payload,
        organizationId: authContext.organizationId,
      },
      headers: requestHeaders,
    });

    await auditRepository.appendAuditLog({
      organizationId: authContext.organizationId,
      eventType: 'invitation.created',
      actorUserId: authContext.user.id,
      actorRole: authContext.role,
      targetEmail: payload.email,
      targetInvitationId: invitation.id,
      requestId,
      ipAddress: getClientIpAddress(requestHeaders),
      userAgent: requestHeaders.get('user-agent'),
      metadata: {
        invitedRole: payload.role,
      },
    });

    return jsonSuccess(requestId, 201, {
      invitationId: invitation.id,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'UnauthorizedAuthError') {
      return jsonFailure(requestId, 401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (error instanceof Error && error.name === 'ForbiddenAuthError') {
      return jsonFailure(requestId, 403, 'FORBIDDEN', 'You do not have access to this resource');
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return jsonFailure(requestId, 400, 'VALIDATION_ERROR', 'Request payload is invalid');
    }

    if (isUniqueViolation(error)) {
      return jsonFailure(
        requestId,
        409,
        'CONFLICT',
        'A pending invitation already exists for that email',
      );
    }

    if (
      isBetterAuthConflict(error, 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION') ||
      isBetterAuthConflict(error, 'USER_ALREADY_MEMBER_OF_ORGANIZATION')
    ) {
      return jsonFailure(
        requestId,
        409,
        'CONFLICT',
        error.body?.message ?? 'A pending invitation already exists for that email',
      );
    }

    throw error;
  }
}
