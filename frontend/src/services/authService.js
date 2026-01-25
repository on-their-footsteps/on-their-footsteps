/**
 * Authentication Service - Centralized authentication logic
 * Handles login, logout, token management, and user session
 */

import api from './api';
import ApiService from './apiService';

class AuthService {
  constructor(apiService = null) {
    this.apiService = apiService || new ApiService();
    this.api = api;
  }

  /**
   * Authenticate user with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {boolean} credentials.isGuest - Guest mode flag
   * @returns {Promise<Object>} Authentication result
   */
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Store token and user data
      this.apiService.setToken(access_token);
      this.apiService.setUser(user);
      
      return { success: true, user, token: access_token };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      const { access_token, user } = response.data;
      
      // Store token and user data
      this.apiService.setToken(access_token);
      this.apiService.setUser(user);
      
      return { success: true, user, token: access_token };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Logout user and clear session
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      // Call logout endpoint if available
      await this.api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      this.apiService.removeToken();
      this.apiService.removeUser();
    }
    
    return { success: true };
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = this.apiService.getToken();
    return !!token;
  }

  /**
   * Get current user data
   * @returns {Object|null} User data
   */
  getCurrentUser() {
    const userStr = this.apiService.getUser();
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh');
      const { access_token } = response.data;
      
      // Update stored token
      this.apiService.setToken(access_token);
      
      return { success: true, token: access_token };
    } catch (error) {
      // If refresh fails, logout user
      await this.logout();
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Get user profile from server
   * @returns {Promise<Object>} Profile data
   */
  async getProfile() {
    try {
      const response = await this.api.get('/auth/me');
      const user = response.data;
      
      // Update stored user data
      this.apiService.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/auth/profile', profileData);
      const user = response.data;
      
      // Update stored user data
      this.apiService.setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset request result
   */
  async forgotPassword(email) {
    try {
      await this.api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(token, password) {
    try {
      await this.api.post('/auth/reset-password', { token, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Validate current session with server
   * @returns {Promise<Object>} Validation result
   */
  async validateSession() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'No token found' };
    }

    try {
      const response = await this.api.get('/auth/validate');
      return { success: true, valid: true };
    } catch (error) {
      // If validation fails, logout user
      await this.logout();
      return { 
        success: false, 
        error: this._extractErrorMessage(error) 
      };
    }
  }

  /**
   * Extract error message from error object
   * @private
   * @param {Error} error - Error object
   * @returns {string} Error message
   */
  _extractErrorMessage(error) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export default AuthService;
