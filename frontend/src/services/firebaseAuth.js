import { 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const firebaseAuthService = {
  login: async (email, password) => {
    if (!auth || !db) {
      throw new Error('Firebase is not initialized. Please verify your Firebase configuration in .env');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    const token = await fbUser.getIdToken();

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData;
    if (userDocSnap.exists()) {
      userData = { id: fbUser.uid, ...userDocSnap.data() };
    } else {
      // Default fallback profile if not found
      userData = {
        id: fbUser.uid,
        email: fbUser.email,
        first_name: fbUser.displayName || email.split('@')[0],
        last_name: '',
        role: email.includes('admin') ? 'ADMIN' : 'EMPLOYEE',
        is_superuser: email.includes('admin'),
      };
      await setDoc(userDocRef, {
        ...userData,
        created_at: serverTimestamp()
      });
    }

    return {
      access: token,
      refresh: fbUser.refreshToken,
      user: userData
    };
  },

  getCurrentUser: async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user is currently signed in');

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { id: currentUser.uid, ...userDocSnap.data() };
    }

    return {
      id: currentUser.uid,
      email: currentUser.email,
      first_name: currentUser.displayName || currentUser.email.split('@')[0],
      last_name: '',
      role: 'EMPLOYEE',
      is_superuser: false,
    };
  },

  changePassword: async (oldPassword, newPassword) => {
    if (!auth?.currentUser) throw new Error('No user logged in');
    await updatePassword(auth.currentUser, newPassword);
    return { message: 'Password updated successfully' };
  },

  getUsersList: async (params = {}) => {
    if (!db) throw new Error('Firebase not initialized');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('email'));
    const snapshot = await getDocs(q);
    
    let users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (params.search) {
      const search = params.search.toLowerCase();
      users = users.filter(u => 
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.first_name && u.first_name.toLowerCase().includes(search)) ||
        (u.last_name && u.last_name.toLowerCase().includes(search))
      );
    }
    return { count: users.length, results: users };
  },

  logout: async () => {
    if (auth) {
      await signOut(auth);
    }
  }
};
