import { desc, sql } from 'drizzle-orm';

import type { CreateUserInput, UserDto } from '@acme/shared';

import { getDb } from '../client';
import { users } from '../schema';

export interface UsersRepository {
  listUsers(): Promise<UserDto[]>;
  createUser(input: CreateUserInput): Promise<UserDto>;
  ping(): Promise<boolean>;
}

const toUserDto = (record: typeof users.$inferSelect): UserDto => ({
  id: record.id,
  name: record.name,
  email: record.email,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const createUsersRepository = (): UsersRepository => ({
  async listUsers() {
    const database = getDb();
    const rows = await database.select().from(users).orderBy(desc(users.createdAt));

    return rows.map(toUserDto);
  },

  async createUser(input) {
    const database = getDb();
    const [created] = await database.insert(users).values(input).returning();

    if (!created) {
      throw new Error('Database did not return the created user record');
    }

    return toUserDto(created);
  },

  async ping() {
    const database = getDb();
    await database.execute(sql`select 1`);
    return true;
  },
});
