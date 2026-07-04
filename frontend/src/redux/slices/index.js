import { createSlice } from '@reduxjs/toolkit';

// ===================== Auth Slice =====================
const authInitial = {
  user: JSON.parse(localStorage.getItem('cct_user') || 'null'),
  accessToken: localStorage.getItem('cct_access_token') || null,
  refreshToken: localStorage.getItem('cct_refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('cct_access_token'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('cct_user', JSON.stringify(user));
      localStorage.setItem('cct_access_token', accessToken);
      if (refreshToken) localStorage.setItem('cct_refresh_token', refreshToken);
    },
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
      localStorage.setItem('cct_access_token', accessToken);
      if (refreshToken) localStorage.setItem('cct_refresh_token', refreshToken);
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('cct_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('cct_user');
      localStorage.removeItem('cct_access_token');
      localStorage.removeItem('cct_refresh_token');
    },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
});

export const { setCredentials, setTokens, updateUser, logout, setLoading } = authSlice.actions;
export const authReducer = authSlice.reducer;

// ===================== UI Slice =====================
const uiInitial = {
  theme: localStorage.getItem('cct_theme') || 'light',
  sidebarOpen: true,
  mobileSidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitial,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('cct_theme', state.theme);
      document.documentElement.classList.toggle('dark');
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('cct_theme', action.payload);
      if (action.payload === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleMobileSidebar: (state) => { state.mobileSidebarOpen = !state.mobileSidebarOpen; },
    closeMobileSidebar: (state) => { state.mobileSidebarOpen = false; },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, toggleMobileSidebar, closeMobileSidebar } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// ===================== Notification Slice =====================
const notifInitial = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: notifInitial,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount || 0;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const notif = state.notifications.find(n => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    },
    decrementUnread: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

// ===================== Cart Slice =====================
const cartInitial = {
  items: JSON.parse(localStorage.getItem('cct_cart') || '[]'),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: cartInitial,
  reducers: {
    addToCart: (state, action) => {
      const exists = state.items.find(i => i._id === action.payload._id);
      if (!exists) {
        state.items.push(action.payload);
        localStorage.setItem('cct_cart', JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i._id !== action.payload);
      localStorage.setItem('cct_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cct_cart');
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export default { auth: authReducer, ui: uiReducer, notifications: notificationReducer, cart: cartReducer };
