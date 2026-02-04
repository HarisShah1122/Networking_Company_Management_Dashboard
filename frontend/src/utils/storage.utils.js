// JWT Token Storage
export const getToken = () => {
  try {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;
    
    console.log('🔑 Retrieved JWT token from localStorage:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ Error retrieving JWT token:', error);
    localStorage.removeItem('jwt_token');
    return null;
  }
};

export const setToken = (token) => {
  try {
    console.log('💾 Storing JWT token to localStorage:', token.substring(0, 20) + '...');
    localStorage.setItem('jwt_token', token);
  } catch (error) {
    console.error('❌ Error storing JWT token:', error);
  }
};

export const removeToken = () => {
  console.log('🗑️ Removing JWT token from localStorage');
  localStorage.removeItem('jwt_token');
};

// User data storage (for UI state)
export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    console.log('📦 Retrieved user from localStorage:', parsedUser);
    return parsedUser;
  } catch (error) {
    console.error('❌ Error parsing user from localStorage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const setUser = (user) => {
  try {
    console.log('💾 Storing user to localStorage:', user);
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('❌ Error storing user to localStorage:', error);
  }
};

export const removeUser = () => {
  console.log('🗑️ Removing user from localStorage');
  localStorage.removeItem('user');
};

// Clear all auth data
export const clearAuth = () => {
  removeToken();
  removeUser();
  console.log('🧹 All auth data cleared');
};

// Debug utility
export const debugAuth = () => {
  console.log('🔍 Auth Debug Info:');
  console.log('- JWT Token:', localStorage.getItem('jwt_token')?.substring(0, 20) + '...' || 'none');
  console.log('- User:', localStorage.getItem('user'));
  console.log('- document.cookie:', document.cookie);
};
