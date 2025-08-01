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
  createdAt?: Date;
  updatedAt?: Date;
} 