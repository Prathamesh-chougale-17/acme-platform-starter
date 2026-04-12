import { CreateInvitationInputSchema } from '@acme/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { AppError, jsonSuccess } from '../../lib/http';
import { requireAuthenticatedUser, requireRole } from '../../middleware/auth-context';
import type { AppContext } from '../../middleware/request-context';
import type { UserService } from '../../services/user-service';

export const createUserRoutes = ({ userService }: { userService: UserService }) => {
  const router = new Hono<AppContext>();

  router.use('/users', requireAuthenticatedUser());
  router.use('/me', requireAuthenticatedUser());
  router.get('/users', async (c) => {
    const authContext = c.get('auth');

    if (!authContext) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const workspace = await userService.getUsersWorkspace(authContext);
    return jsonSuccess(c, 200, workspace);
  });

  router.get('/me', async (c) => {
    const authContext = c.get('auth');

    if (!authContext) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    return jsonSuccess(c, 200, userService.getCurrentUser(authContext));
  });

  router.post(
    '/invitations',
    requireRole(['owner', 'admin']),
    zValidator('json', CreateInvitationInputSchema, (result) => {
      if (!result.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Request payload is invalid', {
          issues: result.error.issues,
        });
      }
    }),
    async (c) => {
      const authContext = c.get('auth');

      if (!authContext) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const payload = c.req.valid('json');
      const invitation = await userService.createInvitation(
        authContext,
        new Headers(c.req.raw.headers),
        payload,
      );

      return jsonSuccess(c, 201, invitation);
    },
  );

  return router;
};
