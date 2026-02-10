import axios from 'axios';
import { getToken } from '../../utils/storage.utils';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Enable for session cookies
  timeout: 10000,
});

// Add request interceptor to include JWT token and handle sessions
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    const fullUrl = `${config.baseURL}${config.url}`;
    
    console.log('🌐 === FRONTEND API CALL ===');
    console.log('📍 Frontend URL:', window.location.origin);
    console.log('🎯 Target Backend URL:', fullUrl);
    console.log('� Request Method:', config.method?.toUpperCase());
    console.log('🔗 Request Endpoint:', config.url);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 JWT token attached to request');
    } else {
      console.log('⚠️ API Request without JWT token (using session)');
    }
    
    console.log('🍪 Session cookies will be sent automatically');
    console.log('📤 Request Headers:', config.headers);
    console.log('========================\n');
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('\n✅ === FRONTEND API RESPONSE ===');
    console.log('🎯 Response URL:', response.config.url);
    console.log('📊 Status Code:', response.status);
    console.log('📏 Response Size:', JSON.stringify(response.data).length, 'bytes');
    console.log('⏱️ Response Time:', response.headers['x-response-time'] || 'N/A');
    console.log('=============================\n');
    return response;
  },
  (error) => {
    console.log('\n❌ === FRONTEND API ERROR ===');
    console.log('🎯 Failed URL:', error.config?.url);
    console.log('📊 Error Status:', error.response?.status || 'Network Error');
    console.log('💬 Error Message:', error.message);
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.log('🚫 Network Error - Backend may be down or unreachable');
      console.log('🔧 Check if backend is running at:', error.config?.baseURL);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('🚪 Unauthorized request - clearing auth state');
      // Clear all auth data and redirect to login
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    console.log('============================\n');
    return Promise.reject(error);
  }
);

export default apiClient;
