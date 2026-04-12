'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CreateUserInput, HealthDto, UserDto } from '@acme/shared';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export const useHealthQuery = (): UseQueryResult<HealthDto> =>
  useQuery({
    queryKey: queryKeys.health,
    queryFn: apiClient.getHealth,
    retry: false,
  });

export const useUsersQuery = (): UseQueryResult<UserDto[]> =>
  useQuery({
    queryKey: queryKeys.users.all,
    queryFn: apiClient.getUsers,
  });

export const useCreateUserMutation = (): UseMutationResult<UserDto, Error, CreateUserInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createUser,
    onSuccess(createdUser) {
      queryClient.setQueryData<UserDto[]>(queryKeys.users.all, (currentUsers = []) => [
        createdUser,
        ...currentUsers.filter((user) => user.id !== createdUser.id),
      ]);
    },
  });
};
