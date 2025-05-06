'use client';

import { generateAvatar } from '@/lib/utils';
import type { AuthClient, SignInWithPasswordParams, SignUpParams } from './types';
import type { User } from '@/types/user';

class AuthClientImpl implements AuthClient {
  private readonly baseUrl: string;
  private readonly storage: Storage;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575';
    this.storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
  }

  private getToken(): string | null {
    return this.storage.getItem('token');
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
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async signInWithPassword({ username, password, rememberMe }: SignInWithPasswordParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to sign in' };
      }

      const { token } = await response.json();
      
      if (!token) {
        return { data: null, error: 'No token received from server' };
      }

      this.setToken(token, rememberMe);

      // Get user ID from token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.id;

      // Get user data
      const userResponse = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!userResponse.ok) {
        this.removeToken();
        return { data: null, error: 'Failed to get user info' };
      }

      const user = await userResponse.json();

      // Generate avatar if not provided
      if (!user.avatar) {
        user.avatar = generateAvatar(user.username);
      }

      return { data: user, error: null };
    } catch (error) {
      this.removeToken();
      return { data: null, error: error instanceof Error ? error.message : 'Failed to sign in' };
    }
  }

  async signUp({ username, password, firstName, lastName, email, role }: SignUpParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username, 
          password, 
          password_confirmation: password,
          firstName, 
          lastName, 
          email,
          role 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to sign up' };
      }

      const { info } = await response.json();
      return { data: null, error: null, info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to sign up' };
    }
  }

  async signOut(): Promise<void> {
    this.removeToken();
  }

  async getUser() {
    try {
      const token = this.getToken();
      if (!token) {
        return { data: null, error: null };
      }

      // Get user ID from token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.id;

      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        this.removeToken();
        return { data: null, error: 'Session expired' };
      }

      const user = await response.json();

      // Generate avatar if not provided
      if (!user.avatar) {
        user.avatar = generateAvatar(user.username);
      }

      return { data: user, error: null };
    } catch (error) {
      this.removeToken();
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  }

  async updateUser(id: string, data: Partial<User>) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to update user' };
      }

      const { info } = await response.json();
      return { data: null, error: null, info };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          currentPassword, 
          newPassword,
          newPasswordConfirm: newPassword 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to update password' };
      }

      const { info } = await response.json();
      return { error: null, info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update password' };
    }
  }

  async updateActivity(id: string, isActive: boolean) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${id}/activity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to update activity' };
      }

      const { info } = await response.json();
      return { error: null, info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update activity' };
    }
  }

  async getAllUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/all`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to get users' };
      }

      const users = await response.json();
      return { data: users, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get users' };
    }
  }

  async deleteUser(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to delete user' };
      }

      const { info } = await response.json();
      return { error: null, info };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  }
}

export const authClient = new AuthClientImpl();

