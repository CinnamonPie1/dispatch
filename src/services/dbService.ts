import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Person, Assignment } from '../types';

export const peopleCollection = collection(db, 'people');
export const assignmentsCollection = collection(db, 'assignments');

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Admin check failed", error);
    return false;
  }
}

export async function addPerson(name: string, team: Person['team'], isEmergencyDept: boolean) {
  return addDoc(peopleCollection, {
    name,
    team,
    collaborationCount: 0,
    isEmergencyDept
  });
}

export async function updatePerson(id: string, updates: Partial<Omit<Person, 'id'>>) {
  return updateDoc(doc(db, 'people', id), updates);
}

export async function deletePerson(id: string) {
  return deleteDoc(doc(db, 'people', id));
}

export async function getPeople(): Promise<Person[]> {
  const snapshot = await getDocs(peopleCollection);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Person));
}

export async function saveAssignment(assignment: Omit<Assignment, 'id'>) {
  return addDoc(assignmentsCollection, assignment);
}

export async function confirmCollaboration(assignmentId: string, confirmedIds: string[]) {
  const batch = writeBatch(db);
  
  // Update assignment status
  const assignmentRef = doc(db, 'assignments', assignmentId);
  batch.update(assignmentRef, {
    confirmedCollaborationIds: confirmedIds,
    status: 'confirmed'
  });
  
  // Increment counts for confirmed people
  confirmedIds.forEach(id => {
    const personRef = doc(db, 'people', id);
    batch.update(personRef, {
      collaborationCount: increment(1)
    });
  });
  
  return batch.commit();
}

export async function getAssignments(): Promise<Assignment[]> {
  const q = query(assignmentsCollection);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
}
