import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  UserX, 
  UserCheck, 
  Building2, 
  Mail, 
  Phone,
  ShieldAlert
} from 'lucide-react';
import { employeeApi } from '../../api/employees';
import { departmentApi } from '../../api/departments';
import { RoleBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmployeeModal from './EmployeeModal';
import { useAuth } from '../../context/AuthContext';

const EmployeeList = () => {
  const { isHRorAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'all', 'active', 'inactive'

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department = selectedDept;
      if (activeTab === 'active') params.is_active = 'true';
      if (activeTab === 'inactive') params.is_active = 'false';

      const data = await employeeApi.getEmployees(params);
      setEmployees(data.results || data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data.results || data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, activeTab]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (emp) => {
    try {
      const fullEmp = await employeeApi.getEmployee(emp.id);
      setEditingEmployee(fullEmp);
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to load employee details for editing:', err);
    }
  };

  const handleToggleActive = async (emp) => {
    try {
      setActionLoading(emp.id);
      if (emp.is_active) {
        await employeeApi.deactivateEmployee(emp.id);
      } else {
        await employeeApi.reactivateEmployee(emp.id);
      }
      await fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-400" />
            Employee Directory
          </h1>
          <p className="text-xs text-slate-400">
            Manage staff profiles, department assignments, and access permissions.
          </p>
        </div>

        {isHRorAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, email, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Select */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            {['active', 'inactive', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        {loading ? (
          <LoadingSpinner size="md" message="Loading employee records..." />
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No employees found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department & Title</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isHRorAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Employee Profile Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                          {emp.first_name?.[0] || 'E'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{emp.full_name}</p>
                          <p className="text-[11px] font-mono text-indigo-400">{emp.employee_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-200">{emp.designation}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Building2 className="h-3 w-3" />
                        {emp.department_name || 'Unassigned'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <RoleBadge role={emp.role} />
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{emp.email}</span>
                        </p>
                        {emp.phone && (
                          <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span>{emp.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-slate-400">
                      {formatDate(emp.date_of_joining)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          emp.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {emp.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Actions */}
                    {isHRorAdmin && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Employee"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(emp)}
                            disabled={actionLoading === emp.id}
                            title={emp.is_active ? 'Deactivate Employee' : 'Reactivate Employee'}
                            className={`rounded-lg p-1.5 transition-colors ${
                              emp.is_active
                                ? 'text-rose-400 hover:bg-rose-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {emp.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editingEmployee}
        onSave={fetchEmployees}
      />
    </div>
  );
};

export default EmployeeList;
