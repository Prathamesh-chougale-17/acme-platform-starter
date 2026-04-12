import { z } from 'zod';

export const UserDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateUserInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
});

export const HealthCheckSchema = z.object({
  status: z.enum(['up', 'degraded', 'down']),
  detail: z.string(),
});

export const HealthDtoSchema = z.object({
  service: z.string(),
  environment: z.string(),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
  checks: z.object({
    api: HealthCheckSchema,
    database: HealthCheckSchema,
    observability: HealthCheckSchema,
  }),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type HealthDto = z.infer<typeof HealthDtoSchema>;
