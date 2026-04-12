import { CreateUserInputSchema } from '@acme/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { AppError, jsonSuccess } from '../../lib/http';
import type { AppContext } from '../../middleware/request-context';
import type { UserService } from '../../services/user-service';

export const createUserRoutes = ({ userService }: { userService: UserService }) => {
  const router = new Hono<AppContext>();

  router.get('/users', async (c) => {
    const users = await userService.listUsers();
    return jsonSuccess(c, 200, users);
  });

  router.post(
    '/users',
    zValidator('json', CreateUserInputSchema, (result) => {
      if (!result.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Request payload is invalid', {
          issues: result.error.issues,
        });
      }
    }),
    async (c) => {
      const payload = c.req.valid('json');
      const user = await userService.createUser(payload);

      return jsonSuccess(c, 201, user);
    },
  );

  return router;
};
