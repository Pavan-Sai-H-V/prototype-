import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false, error: null };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        authService.setToken(token);
        const user = await authService.getProfile();
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authService.login(email, password);
      
      // Store token securely
      await SecureStore.setItemAsync('auth_token', response.token);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authService.register(userData);
      
      // Store token securely
      await SecureStore.setItemAsync('auth_token', response.token);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      authService.clearToken();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser.user });
      return updatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Profile update failed';
      throw new Error(errorMessage);
    }
  };

  const updateFCMToken = async (fcmToken) => {
    try {
      await authService.updateFCMToken(fcmToken);
      dispatch({ type: 'UPDATE_USER', payload: { fcmToken } });
    } catch (error) {
      console.error('FCM token update failed:', error);
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    updateFCMToken,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};