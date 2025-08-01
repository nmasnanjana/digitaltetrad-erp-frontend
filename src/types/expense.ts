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
    job_id?: string;
    description: string;
    amount: number;
    edited_by?: string;
    reason_to_edit?: string;
    reviewed_by?: string;
    reviewer_comment?: string;
    status?: 'on_progress' | 'approved' | 'denied';
    reviewed_at?: Date;
    paid: boolean;
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
    updatedAt?: string;
    expenseType?: ExpenseType;
    operationType?: OperationType;
    job?: {
        id: string;
        name: string;
    };
    editor?: {
        id: string;
        firstName: string;
        lastName?: string;
    };
    reviewer?: {
        id: string;
        firstName: string;
        lastName?: string;
    };
}



