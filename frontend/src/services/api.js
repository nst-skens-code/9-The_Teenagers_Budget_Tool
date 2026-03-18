import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee',       flag: '🇮🇳' },
  USD: { symbol: '$',   name: 'US Dollar',          flag: '🇺🇸' },
  EUR: { symbol: '€',   name: 'Euro',               flag: '🇪🇺' },
  GBP: { symbol: '£',   name: 'British Pound',      flag: '🇬🇧' },
  JPY: { symbol: '¥',   name: 'Japanese Yen',       flag: '🇯🇵' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar',    flag: '🇨🇦' },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',  flag: '🇦🇺' },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar',   flag: '🇸🇬' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham',          flag: '🇦🇪' },
  CHF: { symbol: 'Fr',  name: 'Swiss Franc',        flag: '🇨🇭' },
  CNY: { symbol: '¥',   name: 'Chinese Yuan',       flag: '🇨🇳' },
  MXN: { symbol: '$',   name: 'Mexican Peso',       flag: '🇲🇽' },
  BRL: { symbol: 'R$',  name: 'Brazilian Real',     flag: '🇧🇷' },
  KRW: { symbol: '₩',   name: 'South Korean Won',   flag: '🇰🇷' },
  THB: { symbol: '฿',   name: 'Thai Baht',          flag: '🇹🇭' },
};

export const AVATARS = ['😊', '😎', '🦁', '🐯', '🦊', '🐺', '🦄', '🐉', '🦋', '🌟', '🔥', '💎', '🚀', '🎯', '💼', '✈️'];
export const AVATAR_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'];

export const api = {
  // Users
  getAllUsers: async () => {
    const res = await axios.get(`${API_URL}/users`);
    return res.data;
  },
  getUser: async (id) => {
    const res = await axios.get(`${API_URL}/users/${id}`);
    return res.data;
  },
  createUser: async (data) => {
    const res = await axios.post(`${API_URL}/users`, data);
    return res.data;
  },
  updateSettings: async (id, data) => {
    const res = await axios.put(`${API_URL}/users/${id}/settings`, data);
    return res.data;
  },
  resetAccount: async (id) => {
    const res = await axios.post(`${API_URL}/users/${id}/reset`);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await axios.delete(`${API_URL}/users/${id}`);
    return res.data;
  },

  // Transactions
  getTransactions: async (userId) => {
    const res = await axios.get(`${API_URL}/transactions/${userId}`);
    return res.data;
  },
  addTransaction: async (data) => {
    const res = await axios.post(`${API_URL}/transactions`, data);
    return res.data;
  },
  editTransaction: async (id, data) => {
    const res = await axios.put(`${API_URL}/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id) => {
    const res = await axios.delete(`${API_URL}/transactions/${id}`);
    return res.data;
  },

  // Goals
  getGoals: async (userId) => {
    const res = await axios.get(`${API_URL}/goals/${userId}`);
    return res.data;
  },
  createGoal: async (data) => {
    const res = await axios.post(`${API_URL}/goals`, data);
    return res.data;
  },
  updateGoal: async (id, data) => {
    const res = await axios.put(`${API_URL}/goals/${id}`, data);
    return res.data;
  },
  deleteGoal: async (id) => {
    const res = await axios.delete(`${API_URL}/goals/${id}`);
    return res.data;
  },

  // Subscriptions
  getSubscriptions: async (userId) => {
    const res = await axios.get(`${API_URL}/subscriptions/${userId}`);
    return res.data;
  },
  createSubscription: async (data) => {
    const res = await axios.post(`${API_URL}/subscriptions`, data);
    return res.data;
  },
  deleteSubscription: async (id) => {
    const res = await axios.delete(`${API_URL}/subscriptions/${id}`);
    return res.data;
  },

  // Export
  exportToExcel: (userId) => {
    window.open(`${API_URL}/export/${userId}`, '_blank');
  }
};
