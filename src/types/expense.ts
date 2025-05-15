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
    status: 'on_progress' | 'approved' | 'denied';
    reviewed_by?: string;
    reviewer_comment?: string;
    reviewed_at?: string;
    paid: boolean;
    createdAt: string;
    updatedAt: string;
    expenseType?: ExpenseType;
    operationType?: OperationType;
    job?: Job;
    editor?: User;
    reviewer?: User;
}

