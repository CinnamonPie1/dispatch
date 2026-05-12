import { addDays, differenceInDays, startOfDay } from 'date-fns';
import { ShiftType, Team } from '../types';

// Anchor date: May 12, 2024 (Sunday) - Let's assume Team A starts a 24h shift this day.
const ANCHOR_DATE = startOfDay(new Date(2024, 4, 12)); 

const CYCLE: ShiftType[] = ['24h', 'Free', '8h', '8h'];

export function getShiftForTeam(date: Date, team: Team): ShiftType {
  const diff = differenceInDays(startOfDay(date), ANCHOR_DATE);
  const teamOffsets: Record<Team, number> = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
  };
  
  const offset = teamOffsets[team];
  // (T - offset) % 4 ensures that if Team A starts at T=0, Team B starts at T=1, etc.
  const index = ((diff - offset) % 4 + 4) % 4;
  return CYCLE[index];
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
