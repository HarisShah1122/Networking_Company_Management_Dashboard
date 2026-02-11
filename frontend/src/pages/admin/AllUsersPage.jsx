import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import useAuthStore from '../../stores/authStore';
import Loader from '../../components/common/Loader';
import TablePagination from '../../components/common/TablePagination';

const AllUsersPage = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounceTimer = useRef(null);
  const isInitialMount = useRef(true);


  const loadUsers = useCallback(async (search = '', role = '', status = '', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      
      let response;
      if (user?.role === 'CEO') {
        response = await userService.getAll();
      } else {
        response = await userService.getStaffList();
      }
      
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

      // Apply search filter
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        usersList = usersList.filter(user => 
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.phone && user.phone.toLowerCase().includes(searchLower))
        );
      }

      // Apply role filter
      if (role && role.trim()) {
        usersList = usersList.filter(user => user.role === role);
      }

      // Apply status filter
      if (status && status.trim()) {
        usersList = usersList.filter(user => user.status === status);
      }

      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
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
      loadUsers('', '', '', true);
      isInitialMount.current = false;
    }
  }, [loadUsers]);

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

  const getRoleBadgeColor = (role) => {
    const colors = {
      'CEO': 'bg-purple-600 text-white',
      'Manager': 'bg-blue-600 text-white',
      'Staff': 'bg-green-600 text-white',
      'Technician': 'bg-orange-600 text-white'
    };
    return colors[role] || 'bg-gray-600 text-white';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'active': 'bg-green-600 text-white',
      'inactive': 'bg-red-600 text-white',
      'pending': 'bg-yellow-600 text-white'
    };
    return colors[status] || 'bg-gray-600 text-white';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Users</h1>
        <p className="text-gray-600">Complete overview of all users in the system</p>
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
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Management</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {users.filter(u => u.role === 'CEO' || u.role === 'Manager').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by username, email, or phone..."
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
          <option value="CEO">CEO</option>
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
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {user.id ? user.id.slice(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {user.company_id ? user.company_id.slice(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))
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

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Users by Role</h3>
            <div className="space-y-2">
              {['CEO', 'Manager', 'Staff', 'Technician'].map(role => {
                const count = users.filter(u => u.role === role).length;
                const percentage = users.length > 0 ? (count / users.length * 100).toFixed(1) : 0;
                return (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                      <span className="text-sm text-gray-600">{count} users</span>
                    </div>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Users by Status</h3>
            <div className="space-y-2">
              {['active', 'inactive', 'pending'].map(status => {
                const count = users.filter(u => u.status === status).length;
                const percentage = users.length > 0 ? (count / users.length * 100).toFixed(1) : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(status)}`}>
                        {status}
                      </span>
                      <span className="text-sm text-gray-600">{count} users</span>
                    </div>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllUsersPage;
