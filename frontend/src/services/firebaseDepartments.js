import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const firebaseDepartmentService = {
  getDepartments: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const deptRef = collection(db, 'departments');
    const q = query(deptRef, orderBy('name'));
    const snapshot = await getDocs(q);

    // Also get employee count for each department
    const empRef = collection(db, 'employees');
    const empSnapshot = await getDocs(empRef);
    const empDocs = empSnapshot.docs.map(d => d.data());

    const departments = snapshot.docs.map(d => {
      const data = d.data();
      const count = empDocs.filter(e => e.department === data.name || e.department_id === d.id).length;
      return {
        id: d.id,
        ...data,
        employee_count: count
      };
    });

    return departments;
  },

  getDepartment: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'departments', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Department not found');
    return { id: docSnap.id, ...docSnap.data() };
  },

  createDepartment: async (data) => {
    if (!db) throw new Error('Firestore not initialized');
    const deptRef = collection(db, 'departments');
    const newDoc = await addDoc(deptRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: newDoc.id, ...data };
  },

  updateDepartment: async (id, data) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'departments', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return { id, ...data };
  },

  deleteDepartment: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'departments', id);
    await deleteDoc(docRef);
    return { success: true };
  }
};
