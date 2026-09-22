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

const DEFAULT_LEAVE_TYPES = [
  { id: 'casual', name: 'Casual Leave', code: 'CL', allocated_days: 12 },
  { id: 'sick', name: 'Sick Leave', code: 'SL', allocated_days: 10 },
  { id: 'annual', name: 'Annual / Paid Leave', code: 'AL', allocated_days: 15 },
  { id: 'unpaid', name: 'Unpaid Leave', code: 'UL', allocated_days: 30 }
];

export const firebaseLeaveService = {
  getMyBalances: async () => {
    if (!db || !auth?.currentUser) return DEFAULT_LEAVE_TYPES.map(t => ({
      id: t.id,
      leave_type_name: t.name,
      leave_type_code: t.code,
      allocated_days: t.allocated_days,
      used_days: 0,
      remaining_days: t.allocated_days,
      year: new Date().getFullYear()
    }));

    const email = auth.currentUser.email;
    const balRef = collection(db, 'leave_balances');
    const q = query(balRef, where('employee_email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return default initial balances
      return DEFAULT_LEAVE_TYPES.map(t => ({
        id: `${t.id}_${email}`,
        leave_type_name: t.name,
        leave_type_code: t.code,
        allocated_days: t.allocated_days,
        used_days: 0,
        remaining_days: t.allocated_days,
        year: new Date().getFullYear()
      }));
    }

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  getAllBalances: async (params = {}) => {
    if (!db) throw new Error('Firestore not initialized');
    const balRef = collection(db, 'leave_balances');
    const snapshot = await getDocs(balRef);
    let balances = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (params.employee_id) {
      balances = balances.filter(b => b.employee_id === params.employee_id || b.employee_email === params.employee_id);
    }

    return { count: balances.length, results: balances };
  },

  getMyRequests: async () => {
    if (!db || !auth?.currentUser) return [];
    const email = auth.currentUser.email;
    const reqRef = collection(db, 'leave_requests');
    const q = query(reqRef, where('employee_email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  getPendingRequests: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const reqRef = collection(db, 'leave_requests');
    const q = query(reqRef, where('status', '==', 'PENDING'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  getAllRequests: async (params = {}) => {
    if (!db) throw new Error('Firestore not initialized');
    const reqRef = collection(db, 'leave_requests');
    const snapshot = await getDocs(reqRef);
    let requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (params.status && params.status !== 'ALL') {
      requests = requests.filter(r => r.status === params.status);
    }
    if (params.employee_id) {
      requests = requests.filter(r => r.employee_id === params.employee_id || r.employee_email === params.employee_id);
    }

    // Sort by applied_at desc
    requests.sort((a, b) => (b.applied_at || '').localeCompare(a.applied_at || ''));

    return { count: requests.length, results: requests };
  },

  applyLeave: async (data) => {
    if (!db || !auth?.currentUser) throw new Error('Not authenticated');
    const currentUser = auth.currentUser;

    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRequest = {
      ...data,
      total_days: totalDays,
      employee_id: currentUser.uid,
      employee_email: currentUser.email,
      employee_name: currentUser.displayName || currentUser.email.split('@')[0],
      status: 'PENDING',
      applied_at: new Date().toISOString(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'leave_requests'), newRequest);
    return { id: docRef.id, ...newRequest };
  },

  approveLeave: async (id, review_comments = '') => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'leave_requests', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Leave request not found');
    const requestData = docSnap.data();

    await updateDoc(docRef, {
      status: 'APPROVED',
      review_comments,
      reviewed_by: auth?.currentUser?.email || 'Admin',
      reviewed_at: new Date().toISOString(),
      updated_at: serverTimestamp()
    });

    return { id, ...requestData, status: 'APPROVED', review_comments };
  },

  rejectLeave: async (id, review_comments = '') => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'leave_requests', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Leave request not found');
    const requestData = docSnap.data();

    await updateDoc(docRef, {
      status: 'REJECTED',
      review_comments,
      reviewed_by: auth?.currentUser?.email || 'Admin',
      reviewed_at: new Date().toISOString(),
      updated_at: serverTimestamp()
    });

    return { id, ...requestData, status: 'REJECTED', review_comments };
  },

  cancelLeave: async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'leave_requests', id);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      updated_at: serverTimestamp()
    });
    return { id, status: 'CANCELLED', message: 'Leave request cancelled' };
  }
};
