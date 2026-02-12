import axios from 'axios';
import { getToken } from '../../utils/storage.utils';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Enable for session cookies
  timeout: 30000, // Increased to 30 seconds for large queries
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Retry function with exponential backoff
const retryRequest = async (error, retryCount = 0) => {
  const config = error.config;
  
  // Don't retry if we've reached max retries or if it's not a retryable error
  if (
    retryCount >= MAX_RETRIES ||
    !error.response ||
    !RETRY_STATUS_CODES.includes(error.response.status) ||
    error.code === 'ECONNABORTED'
  ) {
    return Promise.reject(error);
  }

  console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}):`, config.url);
  
  // Exponential backoff with jitter
  const delay = RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Update retry count in config
  config.retryCount = retryCount + 1;
  
  return apiClient(config);
};

// Add request interceptor to include JWT token and handle sessions
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    const fullUrl = `${config.baseURL}${config.url}`;
    
    console.log('🌐 === FRONTEND API CALL ===');
    console.log('📍 Frontend URL:', window.location.origin);
    console.log('🎯 Target Backend URL:', fullUrl);
    console.log('📡 Request Method:', config.method?.toUpperCase());
    console.log('🔗 Request Endpoint:', config.url);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
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

// Add response interceptor to handle errors and retries
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata?.startTime;
    
    console.log('\n✅ === FRONTEND API RESPONSE ===');
    console.log('🎯 Response URL:', response.config.url);
    console.log('📊 Status Code:', response.status);
    console.log('📏 Response Size:', JSON.stringify(response.data).length, 'bytes');
    console.log('⏱️ Response Time:', duration + 'ms');
    
    // Performance monitoring
    if (duration > 5000) {
      console.warn('⚠️ Slow API response detected:', duration + 'ms');
    }
    
    console.log('=============================\n');
    return response;
  },
  async (error) => {
    const duration = Date.now() - error.config?.metadata?.startTime;
    
    console.log('\n❌ === FRONTEND API ERROR ===');
    console.log('🎯 Failed URL:', error.config?.url);
    console.log('📊 Error Status:', error.response?.status || 'Network Error');
    console.log('💬 Error Message:', error.message);
    console.log('⏱️ Failed After:', duration + 'ms');
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.log('🚫 Network Error - Backend may be down or unreachable');
      console.log('🔧 Check if backend is running at:', error.config?.baseURL);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏰ Request timeout - took longer than configured timeout');
    }
    
    // Retry logic for specific errors
    const retryCount = error.config?.retryCount || 0;
    if (retryCount < MAX_RETRIES && RETRY_STATUS_CODES.includes(error.response?.status)) {
      console.log('🔄 Attempting retry for retryable error...');
      return retryRequest(error, retryCount);
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
    
    // Enhanced error messages
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timeout. Please check your connection and try again.';
    } else if (error.response?.status === 503) {
      error.userMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (error.response?.status === 429) {
      error.userMessage = 'Too many requests. Please wait and try again.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Server error. Please try again later.';
    }
    
    console.log('============================\n');
    return Promise.reject(error);
  }
);

export default apiClient;
