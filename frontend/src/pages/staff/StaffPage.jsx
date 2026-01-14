import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import useAuthStore from '../../stores/authStore';
import { isManager } from '../../utils/permission.utils';
import Modal from '../../components/common/Modal';
import TablePagination from '../../components/common/TablePagination';
import Loader from '../../components/common/Loader';

const StaffPage = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);

  const { register, handleSubmit, reset, formState: { errors, touchedFields } } = useForm();

  const loadUsers = useCallback(async (search = '', role = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      const response = await userService.getAll();
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response?.users && Array.isArray(response.users)) {
        usersList = response.users;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        usersList = response.data.users;
      } else if (response?.data && Array.isArray(response.data)) {
        usersList = response.data;
      }
      
      // Filter by search term and role on frontend
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        usersList = usersList.filter(user => 
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      if (role && role.trim()) {
        usersList = usersList.filter(user => user.role === role);
      }
      
      setUsers(usersList);
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load users';
      toast.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadUsers('', '', true);
      isInitialMount.current = false;
    }
  }, [loadUsers]);

  // Debounce search term and role filter
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

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
      // Prepare submit data
      const submitData = {
        email: data.email?.trim(),
        username: data.username?.trim(),
        role: data.role,
        status: data.status ?? 'active',
      };

      if (editingUser) {
        // For updates, only include password if it's provided and not empty
        if (data.password && data.password.trim()) {
          submitData.password = data.password.trim();
        }
        // Don't send password field at all if it's empty - this preserves existing password_hash
        await userService.update(editingUser.id, submitData);
        toast.success('User updated successfully!');
      } else {
        // For new users, password is required
        if (!data.password || !data.password.trim()) {
          toast.error('Password is required for new users');
          return;
        }
        submitData.password = data.password.trim();
        await userService.create(submitData);
        toast.success('User created successfully!');
      }
      reset();
      setShowModal(false);
      setEditingUser(null);
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


  const canManage = isManager(user?.role);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Staff Management</h1>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search staff..."
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
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="CEO">CEO</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
        </select>
        {canManage && (
          <button
            onClick={() => { reset(); setEditingUser(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Add User
          </button>
        )}
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    {...register('role', { required: 'Role is required' })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md ${
                      errors.role && touchedFields.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="CEO">CEO</option>
                  </select>
                </div>
                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select {...register('status')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset(); setEditingUser(null); }}
                  className="flex-1 px-4 py-2 border rounded-lg"
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

    </div>
  );
};

export default StaffPage;
