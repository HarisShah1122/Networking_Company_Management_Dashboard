export const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
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

