import { User, CreateUserDTO, UpdateUserDTO, UserRole, isValidEmail, toPublicProfile, UserPublicProfile } from '../models/user';
import { BaseService } from './taskService';
import { generateId } from '../utils/helpers';
import { NotFoundError, ValidationError, UnauthorizedError } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { loadAppConfig } from '../config/app';

export class UserService extends BaseService<User> {
  constructor() {
    super('UserService');
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    this.validateCreateDTO(dto);

    if (this.findByEmail(dto.email)) {
      throw new ValidationError('Email already in use', { email: 'Already exists' });
    }

    const now = new Date();
    const user: User = {
      id: generateId(),
      email: dto.email,
      username: dto.username,
      passwordHash: await this.hashPassword(dto.password),
      role: dto.role ?? UserRole.DEVELOPER,
      displayName: dto.displayName,
      avatarUrl: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(user.id, user);
    this.logger.info('User created', { userId: user.id, role: user.role });
    return user;
  }

  async authenticate(email: string, password: string): Promise<{ user: UserPublicProfile; token: string }> {
    const user = this.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const config = loadAppConfig();
    const token = generateToken(user, config.jwtSecret, config.jwtExpiresIn);
    user.lastLoginAt = new Date();
    this.store.set(user.id, user);

    this.logger.info('User authenticated', { userId: user.id });
    return { user: toPublicProfile(user), token };
  }

  updateUser(id: string, dto: UpdateUserDTO): User {
    const user = this.findById(id);
    if (!user) throw new NotFoundError('User', id);

    const updated: User = { ...user, ...dto, updatedAt: new Date() };
    this.store.set(id, updated);
    this.logger.info('User updated', { userId: id });
    return updated;
  }

  deactivateUser(id: string): void {
    const user = this.findById(id);
    if (!user) throw new NotFoundError('User', id);
    user.isActive = false;
    this.store.set(id, user);
    this.logger.info('User deactivated', { userId: id });
  }

  findByEmail(email: string): User | undefined {
    return this.findAll().find((u) => u.email === email);
  }

  getPublicProfile(id: string): UserPublicProfile {
    const user = this.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return toPublicProfile(user);
  }

  private validateCreateDTO(dto: CreateUserDTO): void {
    if (!isValidEmail(dto.email)) {
      throw new ValidationError('Invalid email', { email: 'Invalid format' });
    }
    if (!dto.password || dto.password.length < 8) {
      throw new ValidationError('Password too short', { password: 'Min 8 characters' });
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Simulated hashing
    return `hashed_${password}_${Date.now()}`;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Simulated verification
    return hash.startsWith(`hashed_${password}`);
  }
}
