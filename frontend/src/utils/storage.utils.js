export const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`Failed to read from localStorage: ${key}`, err);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(`Failed to write to localStorage: ${key}`, err);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Failed to remove from localStorage: ${key}`, err);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (err) {
      console.error('Failed to clear localStorage', err);
    }
  },
};

export const getToken = () => storage.get('token');
export const setToken = (token) => storage.set('token', token);
export const removeToken = () => storage.remove('token');

export const getUser = () => {
  const userStr = storage.get('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (err) {
    console.warn('Failed to parse stored user JSON', err);
    return null;
  }
};

export const setUser = (user) => {
  if (!user) return;
  storage.set('user', JSON.stringify(user));
};

export const removeUser = () => storage.remove('user');