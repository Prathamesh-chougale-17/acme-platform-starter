import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { failure, success, type ErrorCode } from '@acme/shared';

import type { AppContext } from '../middleware/request-context';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const buildMeta = (c: Context<AppContext>) => {
  const traceId = c.get('traceId');

  return {
    requestId: c.get('requestId'),
    ...(traceId ? { traceId } : {}),
  };
};

export const jsonSuccess = <T>(c: Context<AppContext>, statusCode: number, data: T) =>
  c.json(success(data, buildMeta(c)), statusCode as ContentfulStatusCode);

export const jsonError = (
  c: Context<AppContext>,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
) =>
  c.json(
    failure(
      {
        code,
        message,
        details,
      },
      buildMeta(c),
    ),
    statusCode as ContentfulStatusCode,
  );
