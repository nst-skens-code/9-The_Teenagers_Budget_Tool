import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Subscriptions from './pages/Subscriptions';
import SettingsPage from './pages/SettingsPage';
import Loader from './components/Loader';
import { api, CURRENCIES } from './services/api';
import { generateAlerts, getSpendingInsights } from './services/aiEngine';
import { getT, LANGUAGES } from './services/i18n';
import './index.scss';

export const AppContext = React.createContext(null);

// Format a number as currency
export function formatCurrency(amount, currency = 'USD') {
  const info = CURRENCIES[currency] || CURRENCIES.USD;
  const val = Number(amount);
  const isNeg = val < 0;
  const numStr = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${isNeg ? '-' : ''}${info.symbol}${numStr}`;
}

export default function App() {
  const [theme, setTheme]       = useState(() => localStorage.getItem('zs-theme') || 'dark');
  const [lang, setLang]         = useState(() => localStorage.getItem('zs-lang') || 'en');
  const [user, setUser]         = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals]       = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [USER_ID, setUSER_ID]   = useState(() => parseInt(localStorage.getItem('zs-user-id') || '1'));
  const [deferredPrompt, setDeferredPrompt] = useState(null); // PWA install

  // PWA: capture install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const THEME_CYCLE = ['dark', 'light', 'amoled'];

  const toggleTheme = () => {
    setTheme(prev => {
      const idx = THEME_CYCLE.indexOf(prev);
      const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      localStorage.setItem('zs-theme', next);
      return next;
    });
  };

  const setThemeDirect = (t) => {
    setTheme(t);
    localStorage.setItem('zs-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };


  const setLanguage = (code) => {
    setLang(code);
    localStorage.setItem('zs-lang', code);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, txData, usersData, goalsData, subsData] = await Promise.all([
        api.getUser(USER_ID),
        api.getTransactions(USER_ID),
        api.getAllUsers(),
        api.getGoals(USER_ID),
        api.getSubscriptions(USER_ID)
      ]);
      setUser(userData);
      setTransactions(txData);
      setAllUsers(usersData);
      setGoals(goalsData);
      setSubscriptions(subsData);
      if (userData?.theme) {
        setTheme(userData.theme);
        document.documentElement.setAttribute('data-theme', userData.theme);
        localStorage.setItem('zs-theme', userData.theme);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [USER_ID]);

  const switchUser = (id) => {
    setUSER_ID(id);
    localStorage.setItem('zs-user-id', id);
  };

  const addTransaction    = async (tx)       => { await api.addTransaction({ ...tx, user_id: USER_ID }); await fetchData(); };
  const deleteTransaction = async (id)       => { await api.deleteTransaction(id); await fetchData(); };
  const editTransaction   = async (id, data) => { await api.editTransaction(id, data); await fetchData(); };
  const resetAccount      = async ()         => { await api.resetAccount(USER_ID); await fetchData(); };
  const createUser        = async (ud)       => { const r = await api.createUser(ud); await fetchData(); return r; };

  const currency     = user?.currency || 'INR';
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.INR || CURRENCIES.USD;
  const fmt          = (amount) => formatCurrency(amount, currency);

  // AI-generated alerts (memoized)
  const alerts   = useMemo(() => generateAlerts(transactions, user), [transactions, user]);
  const insights = useMemo(() => getSpendingInsights(transactions, fmt), [transactions, currency]);

  // i18n translator
  const t = useMemo(() => getT(lang), [lang]);

  return (
    <AppContext.Provider value={{
      user, allUsers, transactions, theme, toggleTheme, setThemeDirect,
      addTransaction, deleteTransaction, editTransaction,
      resetAccount, createUser, switchUser,
      refetch: fetchData, USER_ID, currency, fmt, currencyInfo,
      lang, setLanguage, t,
      alerts, insights,
      deferredPrompt, installPWA,
      goals, subscriptions,
    }}>
      {loading && !user ? (
        <Loader fullScreen />
      ) : (
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/transactions"  element={<Transactions />} />
              <Route path="/analytics"     element={<Analytics />} />
              <Route path="/goals"         element={<Goals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/settings"      element={<SettingsPage />} />
              <Route path="*"              element={<Navigate to="/" />} />
            </Routes>
          </AppLayout>
        </Router>
      )}
    </AppContext.Provider>
  );
}
