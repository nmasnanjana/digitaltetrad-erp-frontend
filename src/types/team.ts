export type TeamType = 'internal' | 'external';

export interface Team {
  id: number;
  name: string;
  type: TeamType;
  company?: string;
  leader_id: string;
  leader?: {
    id: string;
    firstName: string;
    lastName?: string;
    username: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateTeamRequest {
  name: string;
  type: TeamType;
  company?: string;
  leader_id: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  id: number;
}

export interface TeamFilters {
  search?: string;
  type?: TeamType;
  leader_id?: string;
  limit?: number;
  offset?: number;
}

export interface TeamSummary {
  total: number;
  byType: Record<TeamType, number>;
} 