export type Team = '1' | '2' | '3' | '4';
export type ShiftType = '24h' | 'Free' | '8h';

export interface Person {
  id: string;
  name: string;
  team: Team;
  collaborationCount: number;
  isEmergencyDept: boolean;
}

export interface Assignment {
  id: string;
  date: string; // ISO format
  assignedPeopleIds: string[];
  confirmedCollaborationIds: string[];
  status: 'draft' | 'confirmed';
}
