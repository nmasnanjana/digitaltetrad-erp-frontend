import type { Role } from './role';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email?: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role?: Role;
}
