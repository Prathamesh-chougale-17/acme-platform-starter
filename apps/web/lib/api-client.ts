import { loadWebEnv } from '@acme/config';
import {
  CreateInvitationInputSchema,
  CurrentUserDtoSchema,
  HealthDtoSchema,
  UsersWorkspaceDtoSchema,
  type ApiResponse,
  type CreateInvitationInput,
  type CurrentUserDto,
  type HealthDto,
  type UsersWorkspaceDto,
} from '@acme/shared';
import { z } from 'zod';

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

const env = loadWebEnv({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

const REQUEST_TIMEOUT_MS = 8_000;

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

const request = async <T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
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
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Confirm the API is running at ${env.NEXT_PUBLIC_API_BASE_URL}.`,
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
  createInvitation: (input: CreateInvitationInput) =>
    request(
      '/api/v1/invitations',
      {
        method: 'POST',
        body: JSON.stringify(CreateInvitationInputSchema.parse(input)),
      },
      z.object({
        invitationId: z.uuid(),
      }),
    ),
};
