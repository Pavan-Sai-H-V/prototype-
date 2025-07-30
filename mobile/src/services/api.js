import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // Development
  : 'https://your-production-api.com/api'; // Production

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear invalid token
        await SecureStore.deleteItemAsync('auth_token');
        // Redirect to login or trigger logout
        // This would be handled by the auth context
        console.log('Token expired, redirecting to login');
      } catch (clearError) {
        console.error('Error clearing token:', clearError);
      }
    }

    // Log errors in development
    if (__DEV__) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

export default api;