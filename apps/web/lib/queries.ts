'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type {
  CreateInvitationInput,
  CurrentUserDto,
  HealthDto,
  UsersWorkspaceDto,
} from '@acme/shared';

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

export const useCreateInvitationMutation = (): UseMutationResult<
  { invitationId: string },
  Error,
  CreateInvitationInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createInvitation,
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users.workspace,
      });
    },
  });
};
