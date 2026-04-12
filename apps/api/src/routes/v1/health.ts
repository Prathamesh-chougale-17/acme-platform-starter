import { Hono } from 'hono';

import { jsonSuccess } from '../../lib/http';
import type { AppContext } from '../../middleware/request-context';
import type { HealthService } from '../../services/health-service';

export const createHealthRoutes = ({ healthService }: { healthService: HealthService }) => {
  const router = new Hono<AppContext>();

  router.get('/health', async (c) => {
    const health = await healthService.getHealth();
    return jsonSuccess(c, 200, health);
  });

  return router;
};
