'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { AuditLogListDto, CurrentUserDto, HealthDto, UsersWorkspaceDto } from '@acme/shared';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const useHealthQuery = (): UseQueryResult<HealthDto> =>
  useQuery({
    queryKey: queryKeys.health,
    queryFn: apiClient.getHealth,
    retry: false,
  });

export const useCurrentUserQuery = (): UseQueryResult<CurrentUserDto> =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: apiClient.getMe,
  });

export const useUsersWorkspaceQuery = (): UseQueryResult<UsersWorkspaceDto> =>
  useQuery({
    queryKey: queryKeys.users.workspace,
    queryFn: apiClient.getUsersWorkspace,
  });

export const useAuditLogsQuery = (limit = 25, enabled = true): UseQueryResult<AuditLogListDto> =>
  useQuery({
    queryKey: queryKeys.users.audit(limit),
    queryFn: () => apiClient.getAuditLogs(limit),
    enabled,
  });
