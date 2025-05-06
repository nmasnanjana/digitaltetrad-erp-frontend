import type { User } from '@/types/user';

export interface SignInResponse {
  data: User | null;
  error: string | null;
}

export interface SignUpResponse {
  data: User | null;
  error: string | null;
}

export interface GetUserResponse {
  data: User | null;
  error: string | null;
}

export interface SignInWithPasswordParams {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpParams {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AuthClient {
  signInWithPassword: (params: SignInWithPasswordParams) => Promise<SignInResponse>;
  signUp: (params: SignUpParams) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  getUser: () => Promise<GetUserResponse>;
  updateUser: (id: string, data: Partial<User>) => Promise<{ data: User | null; error: string | null; info?: string }>;
  updatePassword: (id: string, currentPassword: string, newPassword: string) => Promise<{ error: string | null; info?: string }>;
  updateActivity: (id: string, isActive: boolean) => Promise<{ error: string | null; info?: string }>;
  getAllUsers: () => Promise<{ data: User[] | null; error: string | null }>;
  deleteUser: (id: string) => Promise<{ error: string | null; info?: string }>;
} 