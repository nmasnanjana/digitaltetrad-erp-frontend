import { OperationType } from './operationType';
import { Job } from './job';
import { User } from './user';

export interface ExpenseType {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Expense {
    id: number;
    expenses_type_id: number;
    operations: boolean;
    operation_type_id?: number;
    job_id?: number;
    description: string;
    amount: number;
    edited_by?: string;
    reason_to_edit?: string;
    createdAt: string;
    updatedAt: string;
    expenseType?: ExpenseType;
    operationType?: OperationType;
    job?: Job;
    editor?: User;
}

export interface Job {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName?: string;
    username: string;
    email?: string;
    role: 'admin' | 'user' | 'viewer' | 'developer';
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}
