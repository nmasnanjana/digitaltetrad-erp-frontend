import { Team } from './team';
import { Customer } from './customer';

export interface Job {
    id: string;
    name: string;
    status: 'open' | 'in progress' | 'installed' | 'qc' | 'pat' | 'closed';
    type: 'supply and installation' | 'installation' | 'maintenance';
    team_id: number;
    customer_id: number;
    team?: Team;
    customer?: Customer;
    createdAt?: Date;
    updatedAt?: Date;
}