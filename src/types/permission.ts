export interface Permission {
    id: string;
    module: string;
    action: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
} 