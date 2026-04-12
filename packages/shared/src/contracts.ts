import { z } from 'zod';

export const AuthRoleSchema = z.enum(['owner', 'admin', 'member']);

export const UserDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().url().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ActiveOrganizationDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.string().url().nullable(),
  createdAt: z.iso.datetime(),
  metadata: z.record(z.string(), z.unknown()).nullable().default({}),
});

export const OrganizationMemberDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  role: AuthRoleSchema,
  createdAt: z.iso.datetime(),
  user: UserDtoSchema,
});

export const PendingInvitationDtoSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  role: AuthRoleSchema,
  status: z.string(),
  expiresAt: z.iso.datetime(),
  organizationId: z.uuid(),
  inviterId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

export const CurrentUserDtoSchema = z.object({
  user: UserDtoSchema,
  organization: ActiveOrganizationDtoSchema.nullable(),
  role: AuthRoleSchema.nullable(),
});

export const UsersWorkspaceDtoSchema = z.object({
  viewer: CurrentUserDtoSchema,
  members: z.array(OrganizationMemberDtoSchema),
  invitations: z.array(PendingInvitationDtoSchema),
});

export const SignInInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  redirectTo: z.string().trim().optional(),
});

export const SignUpInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  organizationName: z.string().trim().min(2).max(120),
  organizationSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Organization slug must be kebab-case'),
  redirectTo: z.string().trim().optional(),
});

export const CreateInvitationInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  role: AuthRoleSchema.default('member'),
});

export const AcceptInvitationInputSchema = z.object({
  invitationId: z.uuid(),
});

export const ForgotPasswordInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  redirectTo: z.string().trim().optional(),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().trim().min(1),
  newPassword: z.string().min(8).max(128),
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
export type AuthRole = z.infer<typeof AuthRoleSchema>;
export type ActiveOrganizationDto = z.infer<typeof ActiveOrganizationDtoSchema>;
export type OrganizationMemberDto = z.infer<typeof OrganizationMemberDtoSchema>;
export type PendingInvitationDto = z.infer<typeof PendingInvitationDtoSchema>;
export type CurrentUserDto = z.infer<typeof CurrentUserDtoSchema>;
export type UsersWorkspaceDto = z.infer<typeof UsersWorkspaceDtoSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type SignUpInput = z.infer<typeof SignUpInputSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationInputSchema>;
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type HealthDto = z.infer<typeof HealthDtoSchema>;
