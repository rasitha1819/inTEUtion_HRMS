import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { employeeApi } from '../../api/employees';
import { departmentApi } from '../../api/departments';

const EmployeeModal = ({ isOpen, onClose, employee, onSave }) => {
  const isEdit = !!employee;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'EMPLOYEE',
    password: '',
    phone: '',
    designation: '',
    department: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_type: 'FULL_TIME',
    salary: '',
    address: '',
    emergency_contact: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentApi.getDepartments();
        setDepartments(res.results || res);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    if (isOpen) {
      fetchDepts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_id: employee.employee_id || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        role: employee.role || 'EMPLOYEE',
        password: '',
        phone: employee.phone || '',
        designation: employee.designation || '',
        department: employee.department || '',
        date_of_joining: employee.date_of_joining || '',
        employment_type: employee.employment_type || 'FULL_TIME',
        salary: employee.salary || '',
        address: employee.address || '',
        emergency_contact: employee.emergency_contact || '',
        is_active: employee.is_active !== undefined ? employee.is_active : true,
      });
    } else {
      setFormData({
        employee_id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        first_name: '',
        last_name: '',
        email: '',
        role: 'EMPLOYEE',
        password: 'Password@123',
        phone: '',
        designation: '',
        department: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        employment_type: 'FULL_TIME',
        salary: '',
        address: '',
        emergency_contact: '',
        is_active: true,
      });
    }
    setError('');
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password;
      }
      if (!payload.department) {
        delete payload.department;
      }

      if (isEdit) {
        await employeeApi.updateEmployee(employee.id, payload);
      } else {
        await employeeApi.createEmployee(payload);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join(' | ')
        : 'Failed to save employee profile.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit Employee (${employee.employee_id})` : 'Register New Employee'} maxWidth="max-w-2xl">
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employee ID *</label>
            <input
              type="text"
              name="employee_id"
              required
              disabled={isEdit}
              value={formData.employee_id}
              onChange={handleChange}
              placeholder="EMP-001"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">System Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">First Name *</label>
            <input
              type="text"
              name="first_name"
              required
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Jane"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Last Name *</label>
            <input
              type="text"
              name="last_name"
              required
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="jane.doe@company.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              {isEdit ? 'New Password (Optional)' : 'Initial Password *'}
            </label>
            <input
              type="password"
              name="password"
              required={!isEdit}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Designation *</label>
            <input
              type="text"
              name="designation"
              required
              value={formData.designation}
              onChange={handleChange}
              placeholder="Software Engineer"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date of Joining</label>
            <input
              type="date"
              name="date_of_joining"
              value={formData.date_of_joining}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Employment Type</label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Annual Salary ($)</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="75000"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_active" className="text-xs font-medium text-slate-300">
            Account Active (Permit login and attendance recording)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;
