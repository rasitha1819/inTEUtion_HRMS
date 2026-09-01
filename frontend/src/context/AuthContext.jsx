import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { attendanceApi } from '../api/attendance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hrms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hrms_access_token'));
  const [todayAttendance, setTodayAttendance] = useState({
    checkedIn: false,
    checkedOut: false,
    attendance: null,
    loading: false
  });
  const [loading, setLoading] = useState(true);

  // Fetch today's attendance status
  const fetchTodayStatus = useCallback(async () => {
    if (!localStorage.getItem('hrms_access_token')) return;
    try {
      setTodayAttendance(prev => ({ ...prev, loading: true }));
      const statusData = await attendanceApi.getTodayStatus();
      setTodayAttendance({
        checkedIn: statusData.checked_in,
        checkedOut: statusData.checked_out,
        attendance: statusData.attendance,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching today attendance status:', err);
      setTodayAttendance(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initialize and verify user session
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('hrms_access_token');
      if (savedToken) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          localStorage.setItem('hrms_user', JSON.stringify(userData));
          await fetchTodayStatus();
        } catch (err) {
          console.error('Auth initialization error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [fetchTodayStatus]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('hrms_access_token', data.access);
    localStorage.setItem('hrms_refresh_token', data.refresh);
    localStorage.setItem('hrms_user', JSON.stringify(data.user));

    setToken(data.access);
    setUser(data.user);
    await fetchTodayStatus();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('hrms_access_token');
    localStorage.removeItem('hrms_refresh_token');
    localStorage.removeItem('hrms_user');
    setUser(null);
    setToken(null);
    setTodayAttendance({
      checkedIn: false,
      checkedOut: false,
      attendance: null,
      loading: false
    });
  };

  const punchCheckIn = async (notes = '') => {
    const res = await attendanceApi.checkIn(notes);
    await fetchTodayStatus();
    return res;
  };

  const punchCheckOut = async (notes = '') => {
    const res = await attendanceApi.checkOut(notes);
    await fetchTodayStatus();
    return res;
  };

  const isRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        isAdmin: user?.role === 'ADMIN' || user?.is_superuser,
        isHR: user?.role === 'HR',
        isEmployee: user?.role === 'EMPLOYEE',
        isHRorAdmin: user?.role === 'ADMIN' || user?.role === 'HR' || user?.is_superuser,
        todayAttendance,
        login,
        logout,
        fetchTodayStatus,
        punchCheckIn,
        punchCheckOut,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
