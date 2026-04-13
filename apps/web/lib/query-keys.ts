export const queryKeys = {
  health: ['health'] as const,
  me: ['me'] as const,
  users: {
    audit: (limit: number) => ['users', 'audit', limit] as const,
    workspace: ['users', 'workspace'] as const,
  },
};
