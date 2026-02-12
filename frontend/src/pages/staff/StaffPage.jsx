import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import { complaintService } from '../../services/complaintService';
import { areaService } from '../../services/areaService';
import useAuthStore from '../../stores/authStore';
import { isCEO } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const StaffPage = () => {
  // Staff management component with area modal
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [staffWorkloads, setStaffWorkloads] = useState({});
  const [staffAssignments, setStaffAssignments] = useState({});
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [showAreaSection, setShowAreaSection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm();

  const canManage = isCEO(user?.role);

  const loadAreas = useCallback(async () => {
    try {
      const response = await areaService.getAll();
      setAreas(response || []);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load areas';
      toast.error(errorMsg);
      setAreas([]);
    }
  }, []);

  const loadStaffWorkloads = useCallback(async (userList) => {
    try {
      const workloads = {};
      const assignments = {};
      
      for (const user of userList) {
        if (user.role === 'Staff' || user.role === 'Technician') {
          try {
            // Fetch complaints assigned to this staff member (already filtered by company)
            const complaintsResponse = await complaintService.getAll();
            const allComplaints = Array.isArray(complaintsResponse) ? complaintsResponse : [];
            const staffComplaints = allComplaints.filter(complaint => 
              complaint.assignedTo === user.id || complaint.assigned_to === user.id
            );
            
            // Calculate workload metrics
            const activeComplaints = staffComplaints.filter(c => 
              ['pending', 'in_progress'].includes(c.status)
            ).length;
            
            const todayComplaints = staffComplaints.filter(c => {
              const complaintDate = new Date(c.createdAt || c.created_at);
              const today = new Date();
              return complaintDate.toDateString() === today.toDateString();
            }).length;
            
            const completedComplaints = staffComplaints.filter(c => 
              c.status === 'resolved' || c.status === 'closed'
            ).length;
            
            workloads[user.id] = {
              activeComplaints,
              todayComplaints,
              totalComplaints: staffComplaints.length,
              completedComplaints,
              utilizationRate: activeComplaints / 10 // Assuming max 10 active complaints
            };
            
            assignments[user.id] = staffComplaints.slice(0, 5); // Show recent 5 assignments
          } catch (error) {
            console.warn(`Failed to load workload for staff ${user.id}:`, error);
            workloads[user.id] = {
              activeComplaints: 0,
              todayComplaints: 0,
              totalComplaints: 0,
              completedComplaints: 0,
              utilizationRate: 0
            };
            assignments[user.id] = [];
          }
        }
      }
      
      setStaffWorkloads(workloads);
      setStaffAssignments(assignments);
    } catch (error) {
      console.error('Failed to load staff workloads:', error);
    }
  }, []);

  const loadUsers = useCallback(async (search = '', role = '', status = '', isInitialLoad = false) => {
    console.log('🚀 loadUsers called with:', { search, role, status, isInitialLoad, userRole: user?.role, userCompanyId: user?.companyId });
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      
      // Use staff-list endpoint for proper company isolation
      let response = await userService.getStaffList();
      
      console.log('🔍 API Response:', response);
      console.log('👤 User Role:', user?.role);
      console.log('🏢 User Company ID:', user?.companyId);
      
      // Backend already filters by company, so we just need to extract the array
      let usersList = Array.isArray(response) ? response : [];

      console.log('👥 Users list before filtering:', usersList);

      if (search && typeof search === 'string' && search.trim()) {
        const searchLower = search.toLowerCase();
        usersList = usersList.filter(user => 
          (user.username && typeof user.username === 'string' && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && typeof user.email === 'string' && user.email.toLowerCase().includes(searchLower))
        );
        console.log('🔍 After search filter:', usersList);
      }

      if (role && typeof role === 'string' && role.trim()) {
        console.log('🔍 Filtering by role:', role);
        console.log('👥 Available user roles:', usersList.map(u => ({ username: u.username, role: u.role })));
        usersList = usersList.filter(user => user.role === role);
        console.log('🔍 After role filter:', usersList);
      } else {
        console.log('🔍 No role filter applied (role is empty or invalid)');
      }

      if (status && typeof status === 'string' && status.trim()) {
        console.log('🔍 Filtering by status:', status);
        usersList = usersList.filter(user => user.status === status);
        console.log('🔍 After status filter:', usersList);
      } else {
        console.log('🔍 No status filter applied (status is empty or invalid)');
      }

      console.log('📊 Final users list to set:', usersList);
      setUsers(usersList);
      
      // Load staff workloads and assignments
      if (usersList.length > 0) {
        await loadStaffWorkloads(usersList);
      }
    } catch (error) {
      console.error('❌ Error in loadUsers:', error);
      console.error('📊 Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load users';
      toast.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [user?.role, user?.companyId, loadStaffWorkloads]);

  useEffect(() => {
    if (isInitialMount.current) {
      loadUsers('', '', true);
      loadAreas();
      isInitialMount.current = false;
    }
  }, [loadUsers, loadAreas]);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchTerm || roleFilter || statusFilter) {
      setSearching(true);
    }

    debounceTimer.current = setTimeout(() => {
      loadUsers(searchTerm, roleFilter, statusFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, roleFilter, statusFilter, loadUsers]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        email: data.email?.trim(),
        username: data.username?.trim(),
        role: data.role,
        status: data.status ?? 'active',
        // Backend will automatically use the authenticated user's company ID
      };

      if (editingUser) {
        if (data.password && data.password.trim()) {
          submitData.password = data.password.trim();
        }
        await userService.update(editingUser.id, submitData);
        toast.success('User updated successfully!');
      } else {
        if (!data.password || !data.password.trim()) {
          toast.error('Password is required for new users');
          return;
        }
        submitData.password = data.password.trim();
        const response = await userService.create(submitData);
        toast.success('User created successfully!');
        
        // Optimistically add the new user to local state for immediate UI update
        const newUser = response.user || response;
        if (newUser && newUser.id) {
          setUsers(prevUsers => {
            const updatedUsers = [newUser, ...prevUsers];
            console.log('✅ Added new user to local state:', newUser);
            return updatedUsers;
          });
        }
      }

      reset();
      setShowModal(false);
      setEditingUser(null);
      setSelectedArea('');
      setShowAreaSection(false);
      
      // Refresh users list from backend to ensure consistency and get latest data
      await loadUsers(searchTerm, roleFilter, false);
    } catch (error) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors
          .map(err => err.msg ?? err.message ?? JSON.stringify(err))
          .filter((msg, index, self) => self.indexOf(msg) === index)
          .join(', ');
        toast.error(`Validation Error: ${validationErrors}`, { autoClose: 5000 });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        const errorMsg = error.response?.data?.error ?? error.message ?? 'Failed to save user';
        toast.error(errorMsg);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setSelectedArea(user.companyId || '');
    reset({
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status || 'active',
    });
    setShowModal(true);
  };

  const handleViewStaffDetails = (user) => {
    const workload = staffWorkloads[user.id] || {
      activeComplaints: 0,
      todayComplaints: 0,
      totalComplaints: 0,
      completedComplaints: 0,
      utilizationRate: 0
    };
    const assignments = staffAssignments[user.id] || [];
    
    setSelectedStaffDetails({
      ...user,
      workload,
      assignments,
      performanceMetrics: {
        completionRate: workload.totalComplaints > 0 ? (workload.completedComplaints / workload.totalComplaints) * 100 : 0,
        avgDailyTasks: workload.todayComplaints,
        efficiency: workload.utilizationRate * 100
      }
    });
    setShowStaffDetailsModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const getTechnicians = () => {
    return users.filter(user => user.role === 'Technician' || user.role === 'Staff');
  };

  // eslint-disable-next-line no-unused-vars
  const getTimeRemaining = (assignedAt) => {
    if (!assignedAt) return null;
    const assignedTime = new Date(assignedAt);
    const currentTime = new Date();
    const hoursDiff = (currentTime - assignedTime) / (1000 * 60 * 60);
    const remainingHours = 24 - hoursDiff;
    
    if (remainingHours <= 0) return 'Overdue';
    return `${Math.floor(remainingHours)}h ${Math.floor((remainingHours % 1) * 60)}m`;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Users</h1>
        <p className="text-gray-600">Complete overview of all users in the system ({users.length} total)</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Staff Members</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {users.filter(u => u.role === 'Staff' || u.role === 'Technician').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Staff: {users.filter(u => u.role === 'Staff').length} | 
            Technicians: {users.filter(u => u.role === 'Technician').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Management</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {users.filter(u => u.role === 'CEO' || u.role === 'Manager').length}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
            >
              <option value="">All Roles</option>
              {user?.role === 'CEO' && <option value="CEO">CEO</option>}
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Technician">Technician</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            <button
              onClick={() => loadUsers(searchTerm, roleFilter, statusFilter, false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              🔄 Refresh
            </button>

            {canManage && (
              <button
                onClick={() => { reset(); setEditingUser(null); setShowModal(true); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-ind-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
              >
                Add User
              </button>
            )}

            <button
              onClick={() => { reset(); setEditingUser(null); setSelectedArea(''); setShowAreaSection(true); setShowModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 whitespace-nowrap"
            >
              Manage Areas
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  {(users.some(u => u.role === 'Staff' || u.role === 'Technician')) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workload</th>
                  )}
                  {(users.some(u => u.role === 'Staff' || u.role === 'Technician')) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={users.some(u => u.role === 'Staff' || u.role === 'Technician') ? 8 : 6} className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => {
                    const workload = staffWorkloads[user.id] || {
                      activeComplaints: 0,
                      todayComplaints: 0,
                      totalComplaints: 0,
                      completedComplaints: 0,
                      utilizationRate: 0
                    };
                    
                    return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                          user.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company?.name || 'No Company'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      {(user.role === 'Staff' || user.role === 'Technician') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Active:</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                workload.activeComplaints > 5 ? 'bg-red-100 text-red-800' : 
                                workload.activeComplaints > 2 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {workload.activeComplaints}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Today:</span>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {workload.todayComplaints}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}
                      {(user.role === 'Staff' || user.role === 'Technician') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Total:</span>
                              <span className="text-xs font-medium">{workload.totalComplaints}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Completed:</span>
                              <span className="text-xs font-medium text-green-600">{workload.completedComplaints}</span>
                            </div>
                            {workload.totalComplaints > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full" 
                                  style={{ width: `${(workload.completedComplaints / workload.totalComplaints) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(canManage || (user?.id === user?.id && user?.role === 'CEO')) && (
                          <div className="flex items-center justify-end gap-2">
                            {(user.role === 'Staff' || user.role === 'Technician') && (
                              <button
                                onClick={() => handleViewStaffDetails(user)}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title={user.id === user?.id ? "Edit Profile" : "Edit User"}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>

            {users.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <TablePagination
                  pagination={{
                    currentPage,
                    totalPages: Math.ceil(users.length / pageSize),
                    totalCount: users.length,
                  }}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  pageSize={pageSize}
                  isFetching={searching}
                />
              </div>
            )}
          </div>
      
      {showModal && (canManage || (editingUser?.id === user?.id && user?.role === 'CEO')) && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingUser(null); setSelectedArea(''); setShowAreaSection(false); }}
          title={showAreaSection ? 'Manage Areas' : (editingUser ? 'Edit User' : 'Add User')}
          maxWidth={showAreaSection ? "max-w-4xl" : "max-w-2xl"}
        >
          {showAreaSection ? (
            // Area Management Section
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Area Management</h2>
                <button
                  onClick={() => { setShowAreaSection(false); reset(); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Switch to Add User
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area) => (
                  <div key={area.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                       onClick={() => {
                         setSelectedArea(area.id);
                         toast.success(`Selected area: ${area.name}`);
                       }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{area.name}</h4>
                        <p className="text-sm text-gray-500 mb-3">Area ID: {area.id?.substring(0, 8)}...</p>
                        {area.description && (
                          <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                        )}
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            selectedArea === area.id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedArea === area.id ? 'Selected' : 'Available'}
                          </span>
                          {area.code && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Code: {area.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {areas.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Areas Found</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first service area.</p>
                  <button
                    onClick={() => toast.info('Area creation feature coming soon!')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create First Area
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {selectedArea ? (
                    <span className="text-green-600 font-medium">
                      ✓ Area selected: {areas.find(a => a.id === selectedArea)?.name}
                    </span>
                  ) : (
                    <span>Click on an area to select it for user assignment</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setSelectedArea(''); toast.info('Area selection cleared'); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => { setShowAreaSection(false); }}
                    disabled={!selectedArea}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Add User
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // User Form Section
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                  type="email"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.email && touchedFields.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && touchedFields.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Username *</label>
                <input
                  {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'Username must be at least 3 characters' } })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.username && touchedFields.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.username && touchedFields.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <select
                  {...register('role', { 
                    required: 'Role is required'
                  })}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.role && touchedFields.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Technician">Technician</option>
                  {user?.role === 'CEO' && <option value="CEO">CEO</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select an area (optional)</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                {selectedArea && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Users will be assigned to: {areas.find(a => a.id === selectedArea)?.name}
                  </p>
                )}
              </div>
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                    type={showPassword ? "text" : "password"}
                    className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md ${
                      errors.password && touchedFields.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.907a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 14.122l4.242 4.242" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && touchedFields.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
            )}

            {editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {user?.id === editingUser?.id && user?.role === 'CEO' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    {...register('password', { 
                      required: user?.id === editingUser?.id && user?.role === 'CEO' ? false : 'Password is required', 
                      minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder={user?.id === editingUser?.id && user?.role === 'CEO' ? 'Leave blank to keep current password' : 'Enter new password'}
                    className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md ${
                      errors.password && touchedFields.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.907a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 14.122l4.242 4.242" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && touchedFields.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                {user?.id === editingUser?.id && user?.role === 'CEO' && (
                  <p className="text-sm text-gray-500 mt-1">Leave password blank to keep your current password</p>
                )}
              </div>
            )}

            {editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); setEditingUser(null); setSelectedArea(''); setShowAreaSection(false); }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setShowAreaSection(true); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Manage Areas
              </button>
            </div>
            </form>
          )}
        </Modal>
      )}

      {/* Staff Details Modal */}
      {showStaffDetailsModal && selectedStaffDetails && (
        <Modal
          isOpen={showStaffDetailsModal}
          onClose={() => { setShowStaffDetailsModal(false); setSelectedStaffDetails(null); }}
          title="Staff Details"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Username:</span>
                    <span className="font-medium">{selectedStaffDetails.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{selectedStaffDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white">
                      {selectedStaffDetails.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      selectedStaffDetails.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {selectedStaffDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {selectedStaffDetails.created_at ? new Date(selectedStaffDetails.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workload Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Workload</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Tasks:</span>
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      selectedStaffDetails.workload.activeComplaints > 5 ? 'bg-red-100 text-red-800' : 
                      selectedStaffDetails.workload.activeComplaints > 2 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedStaffDetails.workload.activeComplaints}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Today's Tasks:</span>
                    <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {selectedStaffDetails.workload.todayComplaints}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Assigned:</span>
                    <span className="font-medium">{selectedStaffDetails.workload.totalComplaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{selectedStaffDetails.workload.completedComplaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilization:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedStaffDetails.performanceMetrics.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">
                        {selectedStaffDetails.performanceMetrics.efficiency.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedStaffDetails.performanceMetrics.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedStaffDetails.performanceMetrics.avgDailyTasks}
                  </div>
                  <div className="text-sm text-gray-600">Daily Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedStaffDetails.workload.activeComplaints}
                  </div>
                  <div className="text-sm text-gray-600">Active Tasks</div>
                </div>
              </div>
            </div>

            {/* Recent Assignments */}
            {selectedStaffDetails.assignments.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h3>
                <div className="space-y-2">
                  {selectedStaffDetails.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          COMP-{assignment.id?.slice(-6).toUpperCase() || 'UNKNOWN'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {assignment.customer_name || 'Unknown Customer'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => { setShowStaffDetailsModal(false); setSelectedStaffDetails(null); }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffPage;
