import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SAMPLE_DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Software Development & Infrastructure' },
  { name: 'Human Resources', code: 'HR', description: 'People Operations, Recruitment & Culture' },
  { name: 'Product & Design', code: 'PRD', description: 'Product Management and UI/UX Design' },
  { name: 'Sales & Marketing', code: 'SLS', description: 'Business Growth and Brand Strategy' },
  { name: 'Finance & Operations', code: 'FIN', description: 'Accounting, Compliance and Operations' }
];

const SAMPLE_EMPLOYEES = [
  {
    employee_id: 'EMP-0001',
    first_name: 'Alexander',
    last_name: 'Wright',
    email: 'alexander@hrms.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    designation: 'Senior Full Stack Lead',
    joining_date: '2023-01-15',
    salary: '95000',
    is_active: true
  },
  {
    employee_id: 'EMP-0002',
    first_name: 'Sophia',
    last_name: 'Chen',
    email: 'sophia.chen@hrms.com',
    phone: '+1 (555) 345-6789',
    department: 'Human Resources',
    designation: 'HR Specialist',
    joining_date: '2023-04-01',
    salary: '72000',
    is_active: true
  },
  {
    employee_id: 'EMP-0003',
    first_name: 'Marcus',
    last_name: 'Johnson',
    email: 'marcus.j@hrms.com',
    phone: '+1 (555) 456-7890',
    department: 'Product & Design',
    designation: 'Product Designer',
    joining_date: '2023-06-10',
    salary: '80000',
    is_active: true
  },
  {
    employee_id: 'EMP-0004',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena.r@hrms.com',
    phone: '+1 (555) 567-8901',
    department: 'Sales & Marketing',
    designation: 'Marketing Director',
    joining_date: '2022-11-20',
    salary: '88000',
    is_active: true
  }
];

export const seedInitialFirebaseData = async () => {
  if (!db) throw new Error('Firestore not initialized');

  let results = {
    departmentsCreated: 0,
    employeesCreated: 0,
    message: ''
  };

  // Check if departments already exist
  const deptSnap = await getDocs(collection(db, 'departments'));
  if (deptSnap.empty) {
    for (const dept of SAMPLE_DEPARTMENTS) {
      await addDoc(collection(db, 'departments'), {
        ...dept,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      results.departmentsCreated++;
    }
  }

  // Check if employees already exist
  const empSnap = await getDocs(collection(db, 'employees'));
  if (empSnap.empty) {
    for (const emp of SAMPLE_EMPLOYEES) {
      await addDoc(collection(db, 'employees'), {
        ...emp,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      results.employeesCreated++;
    }
  }

  results.message = `Firebase database seeded successfully! (${results.departmentsCreated} departments, ${results.employeesCreated} employees)`;
  return results;
};
