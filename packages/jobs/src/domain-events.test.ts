import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditRepository, WebhookRepository } from '@acme/db';

const { enqueueWebhookDeliveryJobMock } = vi.hoisted(() => ({
  enqueueWebhookDeliveryJobMock: vi.fn(async () => undefined),
}));

vi.mock('./queues', () => ({
  enqueueWebhookDeliveryJob: enqueueWebhookDeliveryJobMock,
}));

import { recordOrganizationAccessEvent } from './domain-events';

describe('recordOrganizationAccessEvent', () => {
  let auditRepository: AuditRepository;
  let webhookRepository: WebhookRepository;

  beforeEach(() => {
    auditRepository = {
      appendAuditLog: vi.fn(async () => undefined),
      listOrganizationAuditLogs: vi.fn(async () => ({ items: [] })),
    };
    webhookRepository = {
      listOrganizationWebhookEndpoints: vi.fn(async () => ({ items: [] })),
      createWebhookEndpoint: vi.fn(async () => {
        throw new Error('not implemented');
      }),
      deleteWebhookEndpoint: vi.fn(async () => false),
      createWebhookDeliveriesForEvent: vi.fn(async () => [
        { id: '9b7dbbb2-84b3-4df9-88cf-a60a4d9cc4d5' },
      ]),
      findWebhookDeliveryById: vi.fn(async () => null),
      markWebhookDeliverySuccess: vi.fn(async () => undefined),
      markWebhookDeliveryFailure: vi.fn(async () => undefined),
    };
    enqueueWebhookDeliveryJobMock.mockClear();
  });

  it('writes the audit record before webhook fan-out', async () => {
    await recordOrganizationAccessEvent({
      auditRepository,
      webhookRepository,
      featureFlags: {
        asyncInviteEmail: true,
        outgoingWebhooks: true,
      },
      event: {
        organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
        eventType: 'invitation.created',
        auditLog: {
          organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
          eventType: 'invitation.created',
        },
        webhookPayload: {
          occurredAt: new Date().toISOString(),
          organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
          eventType: 'invitation.created',
          actor: {
            userId: '4ad9f899-3d6d-48ed-b0e2-9609d7e3522f',
            role: 'owner',
          },
          target: {
            email: 'grace@example.com',
            invitationId: '9b7dbbb2-84b3-4df9-88cf-a60a4d9cc4d5',
          },
          metadata: {
            invitedRole: 'member',
          },
        },
      },
    });

    expect(auditRepository.appendAuditLog).toHaveBeenCalledTimes(1);
    expect(webhookRepository.createWebhookDeliveriesForEvent).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookDeliveryJobMock).toHaveBeenCalledWith({
      deliveryId: '9b7dbbb2-84b3-4df9-88cf-a60a4d9cc4d5',
    });
  });

  it('skips webhook fan-out when the feature flag is disabled', async () => {
    await recordOrganizationAccessEvent({
      auditRepository,
      webhookRepository,
      featureFlags: {
        asyncInviteEmail: false,
        outgoingWebhooks: false,
      },
      event: {
        organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
        eventType: 'organization.created',
        auditLog: {
          organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
          eventType: 'organization.created',
        },
        webhookPayload: {
          occurredAt: new Date().toISOString(),
          organizationId: 'b9844d08-96bd-4af5-a122-3b6dc69a792c',
          eventType: 'organization.created',
          actor: {
            userId: '4ad9f899-3d6d-48ed-b0e2-9609d7e3522f',
            role: 'owner',
          },
          target: {},
          metadata: {},
        },
      },
    });

    expect(auditRepository.appendAuditLog).toHaveBeenCalledTimes(1);
    expect(webhookRepository.createWebhookDeliveriesForEvent).not.toHaveBeenCalled();
    expect(enqueueWebhookDeliveryJobMock).not.toHaveBeenCalled();
  });
});
