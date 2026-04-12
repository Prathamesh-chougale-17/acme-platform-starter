import type { ApiEnv } from '@acme/config';
import { Hono } from 'hono';

import type { HealthService } from '../../services/health-service';
import type { UserService } from '../../services/user-service';
import type { AppContext } from '../../middleware/request-context';
import { createDiagnosticRoutes } from './logs';
import { createHealthRoutes } from './health';
import { createUserRoutes } from './users';

export const createV1Routes = ({
  env,
  userService,
  healthService,
}: {
  env: ApiEnv;
  userService: UserService;
  healthService: HealthService;
}) => {
  const router = new Hono<AppContext>();

  router.route('/', createHealthRoutes({ healthService }));
  router.route('/', createUserRoutes({ userService }));
  router.route('/', createDiagnosticRoutes({ env }));

  return router;
};
