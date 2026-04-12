import { createUsersRepository, type UsersRepository } from '@acme/db';
import { loadApiEnv, type ApiEnv } from '@acme/config';
import { createLogger } from '@acme/logger';
import { APP_VERSION, API_V1_PREFIX } from '@acme/shared';
import * as Sentry from '@sentry/node';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { AppError, jsonError } from './lib/http';
import { metricsContentType, renderMetrics } from './lib/metrics';
import { hydrateAuthContext } from './middleware/auth-context';
import { requestContextMiddleware, type AppContext } from './middleware/request-context';
import { createV1Routes } from './routes/v1';
import { HealthService } from './services/health-service';
import { UserService } from './services/user-service';

const splitCorsOrigins = (origins: string): string[] =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const initSentry = (env: ApiEnv): void => {
  Sentry.init({
    dsn: env.API_SENTRY_DSN,
    enabled: Boolean(env.API_SENTRY_DSN) && env.NODE_ENV !== 'development',
    environment: env.NODE_ENV,
    release: APP_VERSION,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
  });
};

export type CreateAppOptions = {
  env?: ApiEnv;
  usersRepository?: UsersRepository;
};

export const createApp = (options: CreateAppOptions = {}) => {
  const env = options.env ?? loadApiEnv(process.env);
  const logger = createLogger({
    serviceName: env.API_SERVICE_NAME,
    environment: env.NODE_ENV,
    level: env.API_LOG_LEVEL,
    lokiUrl: env.LOKI_URL,
    enablePretty: env.NODE_ENV !== 'production',
    enableLoki: env.API_LOG_TO_LOKI,
  });

  initSentry(env);

  const usersRepository = options.usersRepository ?? createUsersRepository();
  const userService = new UserService(usersRepository);
  const healthService = new HealthService(usersRepository, env);

  const app = new Hono<AppContext>();

  app.use(
    '*',
    cors({
      origin: (origin) => {
        const allowedOrigins = splitCorsOrigins(env.API_CORS_ORIGIN);

        if (!origin) {
          return allowedOrigins[0] ?? env.APP_ORIGIN;
        }

        return allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] ?? env.APP_ORIGIN);
      },
      allowHeaders: ['Content-Type', 'x-request-id'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      exposeHeaders: ['x-request-id'],
      credentials: true,
    }),
  );
  app.use('*', requestContextMiddleware({ env, logger }));
  app.use(`${API_V1_PREFIX}/*`, hydrateAuthContext());

  app.get(
    '/metrics',
    async () =>
      new Response(await renderMetrics(), {
        status: 200,
        headers: {
          'Content-Type': metricsContentType,
        },
      }),
  );

  app.route(
    API_V1_PREFIX,
    createV1Routes({
      env,
      userService,
      healthService,
    }),
  );

  app.onError((error, c) => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    const loggerInstance = c.get('logger');
    loggerInstance?.error(
      {
        err: error,
        ...{
          requestId: c.get('requestId'),
          traceId: c.get('traceId'),
          route: c.req.path,
          method: c.req.method,
          statusCode,
        },
      },
      'request failed',
    );

    Sentry.captureException(error);

    if (error instanceof AppError) {
      return jsonError(c, error.statusCode, error.code, error.message, error.details);
    }

    return jsonError(c, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  });

  app.notFound((c) => jsonError(c, 404, 'NOT_FOUND', 'Route not found'));

  return app;
};
