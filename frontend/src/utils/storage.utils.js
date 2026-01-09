export const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

export const getToken = () => storage.get('token');
export const setToken = (token) => storage.set('token', token);
export const removeToken = () => storage.remove('token');

export const getUser = () => {
  const userStr = storage.get('user');
  return userStr ? JSON.parse(userStr) : null;
};
export const setUser = (user) => storage.set('user', JSON.stringify(user));
export const removeUser = () => storage.remove('user');

