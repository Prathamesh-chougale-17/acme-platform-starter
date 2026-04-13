import type { ApiEnv } from '@acme/config';
import { Hono } from 'hono';

import type { HealthService } from '../../services/health-service';
import type { UserService } from '../../services/user-service';
import type { AppContext } from '../../middleware/request-context';
import { createDiagnosticRoutes } from './logs';
import { createHealthRoutes } from './health';
import { createUserRoutes } from './users';
import { createWebhookRoutes } from './webhooks';
import type { WebhookService } from '../../services/webhook-service';

export const createV1Routes = ({
  env,
  userService,
  healthService,
  webhookService,
}: {
  env: ApiEnv;
  userService: UserService;
  healthService: HealthService;
  webhookService: WebhookService;
}) => {
  const router = new Hono<AppContext>();

  router.route('/', createHealthRoutes({ healthService }));
  router.route('/', createUserRoutes({ userService }));
  router.route('/', createWebhookRoutes({ webhookService }));
  router.route('/', createDiagnosticRoutes({ env }));

  return router;
};
