import type { OperationType } from './operationType';
import type { Job } from './job';
import type { User } from './user';

export interface ExpenseType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  created_at?: string; // Backward compatibility
  updated_at?: string; // Backward compatibility
}

export type ExpenseStatus = 'on_progress' | 'approved' | 'denied';

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
  status?: ExpenseStatus;
  reviewed_at?: string | Date;
  paid: boolean;
  
  // Date fields with backward compatibility
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Related entities
  expenseType?: ExpenseType;
  operationType?: OperationType;
  job?: Pick<Job, 'id' | 'name'>;
  editor?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  reviewer?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface CreateExpenseRequest {
  expenses_type_id: number;
  operations: boolean;
  operation_type_id?: number;
  job_id?: string;
  description: string;
  amount: number;
  edited_by?: string;
  reason_to_edit?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: number;
}

export interface ReviewExpenseRequest {
  status: ExpenseStatus;
  reviewer_comment?: string;
  reviewed_by: string;
}

export interface PaymentRequest {
  paid: boolean;
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
}

export interface ExpenseFilters {
  createdStartDate?: string;
  createdEndDate?: string;
  expenseTypeId?: number;
  category?: 'job' | 'operation';
  jobId?: string;
  operationTypeId?: number;
  status?: ExpenseStatus;
  paid?: boolean;
  limit?: number;
  offset?: number;
}

export interface ExpenseSummary {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  paid: number;
  unpaid: number;
}



