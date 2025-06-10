import { OperationType } from './operationType';
import { Job } from './job';
import { User } from './user';

export interface ExpenseType {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: string;
    expenses_type_id: number;
    operations: boolean;
    job_id?: number;
    description: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    created_at: string;
    updated_at: string;
    created_by: string;
    edited_by?: string;
    reason_to_edit?: string;
    approved_by?: string;
    approved_at?: string;
    rejected_by?: string;
    rejected_at?: string;
    rejected_reason?: string;
    paid_by?: string;
    paid_at?: string;
    payment_method?: string;
    payment_reference?: string;
    paid: boolean;
    job?: Job;
    expenseType?: ExpenseType;
    editor?: User;
    reviewer?: User;
}

