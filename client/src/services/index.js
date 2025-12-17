import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export const habitService = {
  async getHabits() {
    const response = await api.get('/habits');
    return response.data;
  },

  async getHabit(id) {
    const response = await api.get(`/habits/${id}`);
    return response.data;
  },

  async createHabit(habitData) {
    const response = await api.post('/habits', habitData);
    return response.data;
  },

  async updateHabit(id, habitData) {
    const response = await api.put(`/habits/${id}`, habitData);
    return response.data;
  },

  async deleteHabit(id) {
    const response = await api.delete(`/habits/${id}`);
    return response.data;
  },

  async completeHabit(id) {
    const response = await api.post(`/habits/${id}/complete`);
    return response.data;
  },

  async getHabitStats(id) {
    const response = await api.get(`/habits/${id}/stats`);
    return response.data;
  },
};

export const socialService = {
  async searchUsers(query) {
    const response = await api.get(`/social/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async followUser(userId) {
    const response = await api.post(`/social/follow/${userId}`);
    return response.data;
  },

  async unfollowUser(userId) {
    const response = await api.delete(`/social/follow/${userId}`);
    return response.data;
  },

  async getFollowing() {
    const response = await api.get('/social/following');
    return response.data;
  },

  async getFollowers() {
    const response = await api.get('/social/followers');
    return response.data;
  },

  async getActivityFeed(limit = 50, offset = 0) {
    const response = await api.get(`/social/feed?limit=${limit}&offset=${offset}`);
    return response.data;
  },
};

export const userService = {
  async getUserProfile(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};
