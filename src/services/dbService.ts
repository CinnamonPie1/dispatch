import { 
  collection, 
  addDoc, 
  setDoc,
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

export async function addAdmin(uid: string, email: string) {
  return setDoc(doc(db, 'admins', uid), { email });
}

export async function addPeopleBulk(names: string[], team: Person['team'], isEmergencyDept: boolean) {
  const batch = writeBatch(db);
  names.forEach(name => {
    const newPersonRef = doc(peopleCollection);
    batch.set(newPersonRef, {
      name,
      team,
      collaborationCount: 0,
      isEmergencyDept
    });
  });
  return batch.commit();
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

export async function toggleEmergencyDept(id: string, currentStatus: boolean) {
  return updateDoc(doc(db, 'people', id), { isEmergencyDept: !currentStatus });
}

export async function updateCollabCount(id: string, count: number) {
  return updateDoc(doc(db, 'people', id), { collaborationCount: count });
}

export async function toggleLimitOverride(id: string, currentStatus: boolean) {
  return updateDoc(doc(db, 'people', id), { limitOverride: !currentStatus });
}

export async function deletePerson(id: string) {
  try {
    const personRef = doc(db, 'people', id);
    await deleteDoc(personRef);
    return true;
  } catch (error: any) {
    console.error("Firestore Delete Error:", error.message);
    throw error;
  }
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

export async function deleteAssignment(id: string) {
  return deleteDoc(doc(db, 'assignments', id));
}
