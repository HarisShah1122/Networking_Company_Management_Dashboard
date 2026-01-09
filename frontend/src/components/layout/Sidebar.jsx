import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { isCEO, isManager } from '../../utils/permission.utils';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['CEO', 'Manager', 'Staff'] },
    { path: '/customers', label: 'Customers', icon: '👥', roles: ['CEO', 'Manager'] },
    { path: '/connections', label: 'Connections', icon: '🔌', roles: ['CEO', 'Manager'] },
    { path: '/recharges', label: 'Recharges', icon: '💰', roles: ['CEO', 'Manager'] },
    { path: '/stock', label: 'Stock', icon: '📦', roles: ['CEO', 'Manager'] },
    { path: '/accounts', label: 'Accounts', icon: '💼', roles: ['CEO', 'Manager'] },
    { path: '/staff', label: 'Staff', icon: '👤', roles: ['CEO'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.roles.includes('CEO') && isCEO(user?.role)) return true;
    if (item.roles.includes('Manager') && isManager(user?.role)) return true;
    if (item.roles.includes('Staff')) return true;
    return false;
  });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-50 text-gray-800 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-full overflow-hidden`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">PACE Telecom</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden hide-scrollbar">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center px-4 py-2 text-sm text-gray-700 mb-3">
            <span className="mr-2">👤</span>
            <div>
              <div className="font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-600">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

