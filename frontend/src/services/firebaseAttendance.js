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

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const firebaseAttendanceService = {
  getTodayStatus: async () => {
    if (!db || !auth?.currentUser) {
      return { checked_in: false, checked_out: false, attendance: null };
    }

    const today = getTodayDateString();
    const email = auth.currentUser.email;

    const attRef = collection(db, 'attendance');
    const q = query(
      attRef, 
      where('date', '==', today),
      where('employee_email', '==', email)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { checked_in: false, checked_out: false, attendance: null };
    }

    const docData = snapshot.docs[0].data();
    const attendance = { id: snapshot.docs[0].id, ...docData };

    return {
      checked_in: Boolean(attendance.check_in),
      checked_out: Boolean(attendance.check_out),
      attendance: attendance
    };
  },

  checkIn: async (notes = '') => {
    if (!db || !auth?.currentUser) throw new Error('Not authenticated');

    const currentUser = auth.currentUser;
    const today = getTodayDateString();
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Check if already checked in today
    const attRef = collection(db, 'attendance');
    const q = query(
      attRef, 
      where('date', '==', today),
      where('employee_email', '==', currentUser.email)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'attendance', existingDoc.id), {
        check_in: nowTime,
        status: 'PRESENT',
        check_in_notes: notes,
        updated_at: serverTimestamp()
      });
      return { id: existingDoc.id, ...existingDoc.data(), check_in: nowTime, status: 'PRESENT' };
    }

    const newRecord = {
      date: today,
      employee_id: currentUser.uid,
      employee_email: currentUser.email,
      employee_name: currentUser.displayName || currentUser.email.split('@')[0],
      check_in: nowTime,
      check_out: null,
      total_hours: 0,
      status: 'PRESENT',
      check_in_notes: notes,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(attRef, newRecord);
    return { id: docRef.id, ...newRecord };
  },

  checkOut: async (notes = '') => {
    if (!db || !auth?.currentUser) throw new Error('Not authenticated');

    const currentUser = auth.currentUser;
    const today = getTodayDateString();
    const now = new Date();
    const nowTime = now.toLocaleTimeString('en-US', { hour12: false });

    const attRef = collection(db, 'attendance');
    const q = query(
      attRef, 
      where('date', '==', today),
      where('employee_email', '==', currentUser.email)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No check-in found for today. Please check in first.');
    }

    const existingDoc = snapshot.docs[0];
    const data = existingDoc.data();

    // Calculate total hours worked
    let totalHours = 8.0;
    if (data.check_in) {
      try {
        const [inH, inM] = data.check_in.split(':').map(Number);
        const [outH, outM] = nowTime.split(':').map(Number);
        const diffMs = (outH * 3600 + outM * 60) - (inH * 3600 + inM * 60);
        totalHours = Math.max(0, +(diffMs / 3600).toFixed(2));
      } catch (e) {
        totalHours = 8.0;
      }
    }

    await updateDoc(doc(db, 'attendance', existingDoc.id), {
      check_out: nowTime,
      total_hours: totalHours,
      check_out_notes: notes,
      updated_at: serverTimestamp()
    });

    return {
      id: existingDoc.id,
      ...data,
      check_out: nowTime,
      total_hours: totalHours
    };
  },

  getAttendanceLogs: async (params = {}) => {
    if (!db) throw new Error('Firestore not initialized');
    const attRef = collection(db, 'attendance');
    const q = query(attRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    let logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (params.employee_id) {
      logs = logs.filter(l => l.employee_id === params.employee_id || l.employee_email === params.employee_id);
    }
    if (params.date) {
      logs = logs.filter(l => l.date === params.date);
    }
    if (params.status) {
      logs = logs.filter(l => l.status === params.status);
    }

    return {
      count: logs.length,
      results: logs
    };
  },

  getAttendanceSummary: async (params = {}) => {
    if (!db) throw new Error('Firestore not initialized');
    const attRef = collection(db, 'attendance');
    const snapshot = await getDocs(attRef);
    const logs = snapshot.docs.map(d => d.data());

    const today = getTodayDateString();
    const todayLogs = logs.filter(l => l.date === today);

    return {
      total_records: logs.length,
      today_present: todayLogs.filter(l => l.status === 'PRESENT').length,
      today_absent: todayLogs.filter(l => l.status === 'ABSENT').length,
      today_half_day: todayLogs.filter(l => l.status === 'HALF_DAY').length,
      today_late: todayLogs.filter(l => l.status === 'LATE').length,
    };
  }
};
