export type UserRole = 'seller' | 'client';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  email: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === 'seller' || value === 'client';
}

export function canCreateRoom(user: User): boolean {
  return user.role === 'seller';
}

export function getUserInitials(user: Pick<User, 'username'>): string {
  return user.username
    .split(' ')
    .map((word) => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}