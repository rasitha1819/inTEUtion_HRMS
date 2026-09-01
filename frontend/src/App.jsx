import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import AttendanceTracking from './pages/attendance/AttendanceTracking';
import LeaveManagement from './pages/leaves/LeaveManagement';
import EmployeeList from './pages/employees/EmployeeList';
import DepartmentList from './pages/departments/DepartmentList';
import Profile from './pages/profile/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendanceTracking />} />
              <Route path="/leaves" element={<LeaveManagement />} />
              <Route path="/profile" element={<Profile />} />

              {/* HR & Admin Restricted Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />}>
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/departments" element={<DepartmentList />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
