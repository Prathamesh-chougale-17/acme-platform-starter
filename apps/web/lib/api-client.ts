import {
  AcceptInvitationResultDtoSchema,
  AuditLogListDtoSchema,
  CreateInvitationInputSchema,
  CreateInvitationResultDtoSchema,
  CreateOrganizationInputSchema,
  CreateOrganizationResultDtoSchema,
  CurrentUserDtoSchema,
  HealthDtoSchema,
  UsersWorkspaceDtoSchema,
  type AcceptInvitationResultDto,
  type AuditLogListDto,
  type ApiResponse,
  type CreateInvitationInput,
  type CreateInvitationResultDto,
  type CreateOrganizationInput,
  type CreateOrganizationResultDto,
  type CurrentUserDto,
  type HealthDto,
  type UsersWorkspaceDto,
} from '@acme/shared';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const REQUEST_TIMEOUT_MS = 8_000;
const INVITATION_REQUEST_TIMEOUT_MS = 45_000;

const parseApiResponse = async (response: Response): Promise<ApiResponse<unknown> | undefined> => {
  const text = await response.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as ApiResponse<unknown>;
  } catch {
    return undefined;
  }
};

const request = async <T>(
  path: string,
  init: RequestInit,
  schema: { parse(data: unknown): T },
  options?: {
    timeoutMs?: number;
    timeoutMessage?: string;
  },
): Promise<T> => {
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      cache: 'no-store',
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });

    const payload = await parseApiResponse(response);

    if (!response.ok) {
      throw new ApiClientError(
        payload?.success === false
          ? payload.error.message
          : `Request failed with status ${response.status}`,
        response.status,
        payload?.success === false ? payload.error.code : undefined,
      );
    }

    if (!payload?.success) {
      throw new ApiClientError('API returned an invalid response payload', response.status);
    }

    return schema.parse(payload.data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(
        options?.timeoutMessage ??
          `Request timed out after ${timeoutMs / 1000}s. Confirm the web API proxy is configured and the upstream API is reachable.`,
        504,
        'REQUEST_TIMEOUT',
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const apiClient = {
  getHealth: () => request<HealthDto>('/api/v1/health', { method: 'GET' }, HealthDtoSchema),
  getMe: () => request<CurrentUserDto>('/api/v1/me', { method: 'GET' }, CurrentUserDtoSchema),
  getUsersWorkspace: () =>
    request<UsersWorkspaceDto>('/api/v1/users', { method: 'GET' }, UsersWorkspaceDtoSchema),
  getAuditLogs: (limit = 25) =>
    request<AuditLogListDto>(
      `/api/v1/audit-logs?limit=${encodeURIComponent(String(limit))}`,
      { method: 'GET' },
      AuditLogListDtoSchema,
    ),
  createOrganization: (input: CreateOrganizationInput) =>
    request<CreateOrganizationResultDto>(
      '/api/v1/organizations',
      {
        method: 'POST',
        body: JSON.stringify(CreateOrganizationInputSchema.parse(input)),
      },
      CreateOrganizationResultDtoSchema,
    ),
  createInvitation: (input: CreateInvitationInput) =>
    request<CreateInvitationResultDto>(
      '/api/invitations',
      {
        method: 'POST',
        body: JSON.stringify(CreateInvitationInputSchema.parse(input)),
      },
      CreateInvitationResultDtoSchema,
      {
        timeoutMs: INVITATION_REQUEST_TIMEOUT_MS,
        timeoutMessage: `Invitation request timed out after ${INVITATION_REQUEST_TIMEOUT_MS / 1000}s. The invite may still finish in the background. Refresh the workspace and confirm the email provider is healthy.`,
      },
    ),
  acceptInvitation: (invitationId: string) =>
    request<AcceptInvitationResultDto>(
      `/api/v1/invitations/${encodeURIComponent(invitationId)}/accept`,
      {
        method: 'POST',
      },
      AcceptInvitationResultDtoSchema,
    ),
};
