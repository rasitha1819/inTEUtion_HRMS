import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const firebaseDashboardService = {
  getMetrics: async () => {
    if (!db) throw new Error('Firestore not initialized');

    const todayStr = new Date().toISOString().split('T')[0];
    const currentUser = auth?.currentUser;

    // 1. Fetch Employees
    const empSnap = await getDocs(collection(db, 'employees'));
    const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.is_active !== false).length;

    // 2. Fetch Departments
    const deptSnap = await getDocs(collection(db, 'departments'));
    const departments = deptSnap.docs.map(d => {
      const data = d.data();
      const count = employees.filter(e => e.department === data.name || e.department_id === d.id).length;
      return {
        id: d.id,
        name: data.name,
        code: data.code || data.name.slice(0, 3).toUpperCase(),
        total_members: count
      };
    });

    // 3. Fetch Today Attendance
    const attSnap = await getDocs(collection(db, 'attendance'));
    const attendanceLogs = attSnap.docs.map(d => d.data());
    const todayLogs = attendanceLogs.filter(l => l.date === todayStr);

    const todayPresent = todayLogs.filter(l => l.status === 'PRESENT').length;
    const todayLate = todayLogs.filter(l => l.status === 'LATE').length;
    const checkedInTotal = todayLogs.filter(l => Boolean(l.check_in)).length;
    const todayAbsent = Math.max(0, activeEmployees - checkedInTotal);

    // 4. Fetch Leaves
    const leaveSnap = await getDocs(collection(db, 'leave_requests'));
    const leaveRequests = leaveSnap.docs.map(d => d.data());
    const pendingLeaves = leaveRequests.filter(r => r.status === 'PENDING').length;
    const todayOnLeave = leaveRequests.filter(r => {
      if (r.status !== 'APPROVED') return false;
      return todayStr >= r.start_date && todayStr <= r.end_date;
    }).length;

    const attendanceRate = activeEmployees > 0 
      ? Math.round((checkedInTotal / activeEmployees) * 100) 
      : 0;

    // 5. Generate 7-day Attendance Trends
    const attendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = DAYS[d.getDay()];

      const dayLogs = attendanceLogs.filter(l => l.date === dStr);
      attendanceTrends.push({
        day: dayName,
        date: dStr,
        present: dayLogs.filter(l => l.status === 'PRESENT' || Boolean(l.check_in)).length,
        late: dayLogs.filter(l => l.status === 'LATE').length
      });
    }

    // 6. User Personal Stats
    let userStats = {
      month_present_days: 0,
      month_late_days: 0,
      remaining_leave_days: 20,
      pending_my_leaves: 0
    };

    if (currentUser?.email) {
      const myLogs = attendanceLogs.filter(l => l.employee_email === currentUser.email);
      userStats.month_present_days = myLogs.filter(l => Boolean(l.check_in)).length;
      userStats.month_late_days = myLogs.filter(l => l.status === 'LATE').length;

      const myLeaves = leaveRequests.filter(l => l.employee_email === currentUser.email);
      userStats.pending_my_leaves = myLeaves.filter(l => l.status === 'PENDING').length;

      const balSnap = await getDocs(query(collection(db, 'leave_balances'), where('employee_email', '==', currentUser.email)));
      if (!balSnap.empty) {
        userStats.remaining_leave_days = balSnap.docs.reduce((acc, d) => acc + (d.data().remaining_days || 0), 0);
      }
    }

    return {
      summary: {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        checked_in_total: checkedInTotal,
        today_present: todayPresent,
        today_late: todayLate,
        today_absent: todayAbsent,
        today_on_leave: todayOnLeave,
        pending_leaves_count: pendingLeaves,
        attendance_rate: attendanceRate
      },
      attendance_trends: attendanceTrends,
      department_distribution: departments,
      user_stats: userStats
    };
  }
};
