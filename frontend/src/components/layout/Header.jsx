import useAuthStore from '../../stores/authStore';

const Header = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex-1 lg:ml-0 ml-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {user?.company?.name ? `${user.company.name} dashboard` : 'Dashboard'}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <span className="font-medium text-gray-900">{user?.username}</span>
              <span className="ml-2 text-gray-500">({user?.role})</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

