import { useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
    roleId: string;
    role?: {
        id: string;
        name: string;
        permissions?: Array<{
            id: string;
            module: string;
            action: string;
        }>;
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

export function useAuth(): AuthContextType {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:4575/api/auth/me', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, isLoading, error };
} 