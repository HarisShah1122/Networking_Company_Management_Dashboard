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
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Networking Co.</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center px-4 py-2 text-sm text-gray-300">
            <span className="mr-2">👤</span>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-xs text-gray-400">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-2 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

