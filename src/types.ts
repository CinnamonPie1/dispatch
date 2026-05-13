export type Team = '1' | '2' | '3' | '4';
export type ShiftType = '24h' | 'Free' | '8h';

export interface Person {
  id: string;
  name: string;
  team: Team;
  collaborationCount: number;
  isEmergencyDept: boolean;
  limitOverride?: boolean;
}

export type RaffleType = 'morning' | 'afternoon';

export interface Assignment {
  id: string;
  date: string; // ISO format
  type?: RaffleType;
  assignedPeopleIds: string[];
  confirmedCollaborationIds: string[];
  status: 'draft' | 'confirmed';
  createdAt?: string; // ISO format for generation timestamp
}
