import type { UsersRepository } from '@acme/db';
import type { CreateUserInput, UserDto } from '@acme/shared';

import { AppError } from '../lib/http';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

export class UserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  listUsers(): Promise<UserDto[]> {
    return this.usersRepository.listUsers();
  }

  async createUser(input: CreateUserInput): Promise<UserDto> {
    try {
      return await this.usersRepository.createUser(input);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(409, 'CONFLICT', 'A user with that email already exists');
      }

      throw error;
    }
  }
}
