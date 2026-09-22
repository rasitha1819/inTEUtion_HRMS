import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const firebaseEmployeeService = {
  getEmployees: async (params = {}) => {
    if (!db) throw new Error('Firestore not initialized');
    const empRef = collection(db, 'employees');
    const q = query(empRef, orderBy('first_name', 'asc'));
    const snapshot = await getDocs(q);

    let employees = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Apply client-side filters for Firestore flexibility
    if (params.search) {
      const search = params.search.toLowerCase();
      employees = employees.filter(e => 
        (e.first_name && e.first_name.toLowerCase().includes(search)) ||
        (e.last_name && e.last_name.toLowerCase().includes(search)) ||
        (e.email && e.email.toLowerCase().includes(search)) ||
        (e.employee_id && e.employee_id.toLowerCase().includes(search)) ||
        (e.designation && e.designation.toLowerCase().includes(search))
      );
    }

    if (params.department && params.department !== 'ALL') {
      employees = employees.filter(e => e.department === params.department || e.department_id === params.department);
    }

    if (params.status) {
      const isActive = params.status === 'ACTIVE' || params.status === true || params.status === 'true';
      employees = employees.filter(e => e.is_active === isActive);
    }

    return {
      count: employees.length,
      results: employees
    };
  },

  getEmployee: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Employee not found');
    return { id: docSnap.id, ...docSnap.data() };
  },

  getMyProfile: async () => {
    if (!db || !auth?.currentUser) throw new Error('Not authenticated');
    const currentUser = auth.currentUser;

    const empRef = collection(db, 'employees');
    // Find by user_id or email
    const q = query(empRef, where('email', '==', currentUser.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    }

    // Return synthetic profile if employee document isn't created yet
    return {
      id: currentUser.uid,
      first_name: currentUser.displayName || currentUser.email.split('@')[0],
      last_name: '',
      email: currentUser.email,
      role: 'ADMIN',
      designation: 'Administrator',
      department_name: 'Management',
      is_active: true
    };
  },

  createEmployee: async (data) => {
    if (!db) throw new Error('Firestore not initialized');
    const empRef = collection(db, 'employees');
    
    // Auto-generate employee code if missing
    const empCode = data.employee_id || `EMP-${Date.now().toString().slice(-4)}`;

    const newDoc = await addDoc(empRef, {
      ...data,
      employee_id: empCode,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return { id: newDoc.id, employee_id: empCode, ...data, is_active: true };
  },

  updateEmployee: async (id, data) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp()
    });
    return { id, ...data };
  },

  deactivateEmployee: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
      is_active: false,
      updated_at: serverTimestamp()
    });
    return { id, is_active: false, message: 'Employee deactivated' };
  },

  reactivateEmployee: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, {
      is_active: true,
      updated_at: serverTimestamp()
    });
    return { id, is_active: true, message: 'Employee reactivated' };
  }
};
