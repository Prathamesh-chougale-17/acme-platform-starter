import { loadWebEnv } from '@acme/config';
import {
  CreateUserInputSchema,
  HealthDtoSchema,
  UserDtoSchema,
  type ApiResponse,
  type CreateUserInput,
  type HealthDto,
  type UserDto,
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

const request = async <T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> => {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || !payload.success) {
    throw new ApiClientError(
      payload.success ? 'Unknown API failure' : payload.error.message,
      response.status,
      payload.success ? undefined : payload.error.code,
    );
  }

  return schema.parse(payload.data);
};

export const apiClient = {
  getHealth: () => request<HealthDto>('/api/v1/health', { method: 'GET' }, HealthDtoSchema),
  getUsers: () => request<UserDto[]>('/api/v1/users', { method: 'GET' }, z.array(UserDtoSchema)),
  createUser: (input: CreateUserInput) =>
    request<UserDto>(
      '/api/v1/users',
      {
        method: 'POST',
        body: JSON.stringify(CreateUserInputSchema.parse(input)),
      },
      UserDtoSchema,
    ),
};
