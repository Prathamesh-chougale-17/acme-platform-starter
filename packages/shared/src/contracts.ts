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

export const AuditEventTypeSchema = z.enum([
  'organization.created',
  'invitation.created',
  'invitation.accepted',
]);

export const WebhookEventTypeSchema = AuditEventTypeSchema;

export const AuditActorDtoSchema = z.object({
  userId: z.uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  role: AuthRoleSchema.nullable(),
});

export const AuditLogEntryDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  eventType: AuditEventTypeSchema,
  actor: AuditActorDtoSchema.nullable(),
  targetUserId: z.uuid().nullable(),
  targetEmail: z.string().email().nullable(),
  targetInvitationId: z.uuid().nullable(),
  requestId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable().default({}),
  createdAt: z.iso.datetime(),
});

export const AuditLogListDtoSchema = z.object({
  items: z.array(AuditLogEntryDtoSchema),
});

export const WebhookEndpointDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  url: z.url(),
  eventTypes: z.array(WebhookEventTypeSchema).min(1),
  active: z.boolean(),
  createdBy: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const WebhookEndpointListDtoSchema = z.object({
  items: z.array(WebhookEndpointDtoSchema),
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

export const CreateWebhookEndpointInputSchema = z.object({
  url: z.url(),
  eventTypes: z
    .array(WebhookEventTypeSchema)
    .min(1)
    .transform((value) => Array.from(new Set(value))),
});

export const CreateOrganizationInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Organization slug must be kebab-case'),
});

export const CreateOrganizationResultDtoSchema = z.object({
  organizationId: z.uuid(),
});

export const CreateInvitationResultDtoSchema = z.object({
  invitationId: z.uuid(),
});

export const CreateWebhookEndpointResultDtoSchema = z.object({
  endpoint: WebhookEndpointDtoSchema,
  secret: z.string().min(1),
});

export const DeleteWebhookEndpointResultDtoSchema = z.object({
  endpointId: z.uuid(),
});

export const AcceptInvitationResultDtoSchema = z.object({
  invitationId: z.uuid(),
  organizationId: z.uuid(),
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
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;
export type AuditActorDto = z.infer<typeof AuditActorDtoSchema>;
export type AuditLogEntryDto = z.infer<typeof AuditLogEntryDtoSchema>;
export type AuditLogListDto = z.infer<typeof AuditLogListDtoSchema>;
export type WebhookEndpointDto = z.infer<typeof WebhookEndpointDtoSchema>;
export type WebhookEndpointListDto = z.infer<typeof WebhookEndpointListDtoSchema>;
export type CurrentUserDto = z.infer<typeof CurrentUserDtoSchema>;
export type UsersWorkspaceDto = z.infer<typeof UsersWorkspaceDtoSchema>;
export type SignInInput = z.infer<typeof SignInInputSchema>;
export type SignUpInput = z.infer<typeof SignUpInputSchema>;
export type CreateInvitationInput = z.infer<typeof CreateInvitationInputSchema>;
export type CreateWebhookEndpointInput = z.infer<typeof CreateWebhookEndpointInputSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;
export type CreateOrganizationResultDto = z.infer<typeof CreateOrganizationResultDtoSchema>;
export type CreateInvitationResultDto = z.infer<typeof CreateInvitationResultDtoSchema>;
export type CreateWebhookEndpointResultDto = z.infer<typeof CreateWebhookEndpointResultDtoSchema>;
export type DeleteWebhookEndpointResultDto = z.infer<typeof DeleteWebhookEndpointResultDtoSchema>;
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationInputSchema>;
export type AcceptInvitationResultDto = z.infer<typeof AcceptInvitationResultDtoSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type HealthDto = z.infer<typeof HealthDtoSchema>;
