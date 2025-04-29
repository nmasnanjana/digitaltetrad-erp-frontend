export type Role = 'admin' | 'user' | 'viewer' | 'developer';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  role: Role;
  email?: string;
  isActive: boolean;
  lastLogin?: Date;
}
