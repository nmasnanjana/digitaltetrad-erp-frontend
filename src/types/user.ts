export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}
