'use client';

import { generateAvatar } from '@/lib/utils';
import type { AuthClient, SignInWithPasswordParams, SignUpParams } from './types';
import type { User } from '@/types/user';
import type { Role } from '@/types/permission';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  info?: string;
}

class AuthClientImpl implements AuthClient {
  private readonly baseUrl: string;
  private readonly storage: Storage;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api';
    this.storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
  }

  private getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  private setToken(token: string, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async signInWithPassword({ username, password, rememberMe }: SignInWithPasswordParams) {
    try {
      const response = await this.request<{ token: string; user: User }>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const { token, user } = response;
      
      if (!token) {
        return { data: null, error: 'No token received from server' };
      }

      this.setToken(token, rememberMe);

      if (!user.avatar) {
        user.avatar = generateAvatar(user.username);
      }

      return { data: user, error: null };
    } catch (error) {
      this.removeToken();
      return { data: null, error: error instanceof Error ? error.message : 'Failed to sign in' };
    }
  }

  async signUp({ username, password, firstName, lastName, email, roleId }: SignUpParams) {
    try {
      const response = await this.request<ApiResponse<null>>('/users/register', {
        method: 'POST',
        body: JSON.stringify({ 
          username, 
          password, 
          password_confirmation: password,
          firstName, 
          lastName, 
          email,
          roleId 
        }),
      });

      return { data: null, error: null, info: response.info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to sign up' };
    }
  }

  async signOut(): Promise<void> {
    this.removeToken();
  }

  async getUser() {
    try {
      console.log('getUser called');
      const token = this.getToken();
      console.log('Token:', token ? 'exists' : 'not found');
      if (!token) {
        console.log('No token, returning null');
        return { data: null, error: null };
      }

      console.log('Making request to /users/me');
      const user = await this.request<User>('/users/me');
      console.log('User response:', user);

      if (!user.avatar) {
        user.avatar = generateAvatar(user.username);
      }

      return { data: user, error: null };
    } catch (error) {
      console.log('getUser error:', error);
      this.removeToken();
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  }

  async updateUser(id: string, data: Partial<User>) {
    try {
      const response = await this.request<ApiResponse<null>>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return { data: null, error: null, info: response.info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    try {
      const response = await this.request<ApiResponse<null>>(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ 
          currentPassword, 
          newPassword,
          newPasswordConfirm: newPassword 
        }),
      });

      return { error: null, info: response.info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update password' };
    }
  }

  async updateActivity(id: string, isActive: boolean) {
    try {
      const response = await this.request<ApiResponse<null>>(`/users/${id}/activity`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });

      return { error: null, info: response.info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update activity' };
    }
  }

  async getAllUsers() {
    try {
      const users = await this.request<User[]>('/users/all');
      return { data: users, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get users' };
    }
  }

  async deleteUser(id: string) {
    try {
      const response = await this.request<ApiResponse<null>>(`/users/${id}`, {
        method: 'DELETE',
      });

      return { error: null, info: response.info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.request<Role[]>('/roles');
      return { data: roles, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get roles' };
    }
  }

  async createRole(data: { name: string; description?: string }) {
    try {
      const response = await this.request<ApiResponse<Role>>('/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return { data: response.data || null, error: null, info: response.info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create role' };
    }
  }

  async updateRole(id: string, data: { name: string; description?: string; isActive?: boolean }) {
    try {
      const response = await this.request<ApiResponse<Role>>(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return { data: response.data || null, error: null, info: response.info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update role' };
    }
  }

  async deleteRole(id: string) {
    try {
      const response = await this.request<ApiResponse<null>>(`/roles/${id}`, {
        method: 'DELETE',
      });

      return { error: null, info: response.info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete role' };
    }
  }
}

export const authClient = new AuthClientImpl();

