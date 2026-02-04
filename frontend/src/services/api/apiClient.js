import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // ✅ REQUIRED for HTTP-only cookies
});

// Add request interceptor to include session cookie
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.warn('Unauthorized request - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
