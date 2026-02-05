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
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const loadUsers = useCallback(async (search = '', role = '', isInitialLoad = false) => {
    console.log('🚀 loadUsers called with:', { search, role, isInitialLoad, userRole: user?.role, userCompanyId: user?.companyId });
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      
      // Use different endpoints based on user role
      let response;
      if (user?.role === 'CEO') {
        console.log('👑 CEO user, calling userService.getAll()');
        response = await userService.getAll();
      } else {
        console.log('👨 Manager/Staff user, calling userService.getStaffList()');
        response = await userService.getStaffList();
      }
      
      console.log('🔍 API Response:', response);
      console.log('👤 User Role:', user?.role);
      console.log('🏢 User Company ID:', user?.companyId);
      
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
        console.log('✅ Response is array, length:', usersList.length);
        console.log('👥 Sample user:', usersList[0]);
      } else {
        console.log('❌ Response is not an array:', response);
        console.log('📊 Response type:', typeof response);
        console.log('📊 Response keys:', Object.keys(response || {}));
      }

      console.log('👥 Users list before filtering:', usersList);

      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        usersList = usersList.filter(user => 
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
        console.log('🔍 After search filter:', usersList);
      }

      if (role && role.trim()) {
        console.log('🔍 Filtering by role:', role);
        console.log('👥 Available user roles:', usersList.map(u => ({ username: u.username, role: u.role })));
        usersList = usersList.filter(user => user.role === role);
        console.log('🔍 After role filter:', usersList);
      } else {
        console.log('🔍 No role filter applied (role is empty)');
      }

      console.log('📊 Final users list to set:', usersList);
      setUsers(usersList);
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
  }, [user?.role]);

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

    if (searchTerm || roleFilter) {
      setSearching(true);
    }

    debounceTimer.current = setTimeout(() => {
      loadUsers(searchTerm, roleFilter, false);
      setCurrentPage(1);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, roleFilter, loadUsers]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        email: data.email?.trim(),
        username: data.username?.trim(),
        role: data.role,
        status: data.status ?? 'active',
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
    reset({
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status || 'active',
    });
    setShowModal(true);
  };

  const getTechnicians = () => {
    return users.filter(user => user.role === 'Technician' || user.role === 'Staff');
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Staff Management</h1>
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

            <button
              onClick={() => loadUsers(searchTerm, roleFilter, false)}
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
              onClick={() => setShowAreaModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 whitespace-nowrap"
            >
              Manage Areas
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => (
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
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canManage && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

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
      
      {showModal && canManage && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset(); setEditingUser(null); }}
          title={editingUser ? 'Edit User' : 'Add User'}
        >
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
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                  type="password"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                    errors.password && touchedFields.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && touchedFields.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
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
                onClick={() => { setShowModal(false); reset(); setEditingUser(null); }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
      
      {/* Area Management Modal */}
      {showAreaModal && (
        <Modal
          isOpen={showAreaModal}
          onClose={() => setShowAreaModal(false)}
          title="Select Area"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Area *</label>
              <select
                value=""
                onChange={(e) => {
                  const selectedArea = areas.find(area => area.id === e.target.value);
                  if (selectedArea) {
                    toast.success(`Selected area: ${selectedArea.name}`);
                    setShowAreaModal(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose an area...</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area) => (
                <div key={area.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                     onClick={() => {
                       toast.success(`Selected area: ${area.name}`);
                       setShowAreaModal(false);
                     }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{area.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">ID: {area.id?.substring(0, 8)}...</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowAreaModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
