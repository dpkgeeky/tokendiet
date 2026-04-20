export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
  displayName: string;
}

export interface UpdateUserDTO {
  email?: string;
  displayName?: string;
  avatarUrl?: string | null;
  role?: UserRole;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export function toPublicProfile(user: User): UserPublicProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

export function hasPermission(user: User, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.VIEWER]: 0,
    [UserRole.DEVELOPER]: 1,
    [UserRole.MANAGER]: 2,
    [UserRole.ADMIN]: 3,
  };
  return hierarchy[user.role] >= hierarchy[requiredRole];
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
