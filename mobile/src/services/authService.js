import api from './api';

class AuthService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      this.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      this.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateFCMToken(fcmToken) {
    try {
      const response = await api.post('/auth/fcm-token', { fcmToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout');
      this.clearToken();
    } catch (error) {
      // Even if the API call fails, clear local token
      this.clearToken();
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      this.setToken(response.data.token);
      return response.data.token;
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();