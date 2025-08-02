import type { Team } from './team';
import type { Customer } from './customer';

export type JobStatus = 'open' | 'in progress' | 'installed' | 'qc' | 'pat' | 'closed';
export type JobType = 'supply and installation' | 'installation' | 'maintenance';

export interface Job {
  id: string;
  name: string;
  status: JobStatus;
  type: JobType;
  team_id: number;
  customer_id: number;
  completed_at?: string;
  team?: Team;
  customer?: Customer;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateJobRequest {
  name: string;
  status?: JobStatus;
  type: JobType;
  team_id: number;
  customer_id: number;
  completed_at?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  id: string;
}

export interface JobFilters {
  search?: string;
  status?: JobStatus;
  type?: JobType;
  team_id?: number;
  customer_id?: number;
  limit?: number;
  offset?: number;
}

export interface JobSummary {
  total: number;
  byStatus: Record<JobStatus, number>;
  byType: Record<JobType, number>;
}