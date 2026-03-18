import React, { useState, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Target,
  CreditCard, Settings, ChevronRight, Zap, Menu, X,
  TrendingUp, ChevronDown, Plus, Check, Users, Bell, Smartphone
} from 'lucide-react';
import { AppContext } from '../App';
import { CURRENCIES } from '../services/api';
import { LANGUAGES } from '../services/i18n';
import CurrencyConverter from './CurrencyConverter';
import AlertsCenter from './AlertsCenter';
import { api } from '../services/api';
import './AppLayout.scss';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, labelKey: 'transactions' },
  { to: '/analytics', icon: BarChart3, labelKey: 'analytics' },
  { to: '/goals', icon: Target, labelKey: 'goals' },
  { to: '/subscriptions', icon: CreditCard, labelKey: 'subscriptions' },
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen]             = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen]           = useState(false);
  const [showConverter, setShowConverter]         = useState(false);
  const [showAlerts, setShowAlerts]               = useState(false);
  const [showLangMenu, setShowLangMenu]           = useState(false);

  const {
    user, allUsers, theme, toggleTheme, switchUser, USER_ID,
    currencyInfo, alerts, t, lang, setLanguage, deferredPrompt, installPWA
  } = useContext(AppContext);

  const location = useLocation();

  const pageTitleKeys = {
    '/': 'dashboard', '/transactions': 'transactions',
    '/analytics': 'analytics', '/goals': 'goals',
    '/subscriptions': 'subscriptions', '/settings': 'settings',
  };
  const pageTitle = t(pageTitleKeys[location.pathname] || 'dashboard');

  const avatar      = user?.profile_avatar || '😊';
  const avatarColor = user?.profile_color  || '#7c3aed';
  const urgentAlerts = alerts.filter(a => a.type === 'danger' || a.type === 'warning').length;

  const SidebarNav = ({ onClose }) => (
    <nav className="sidebar-nav">
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}>
          {({ isActive }) => (
            <>
              <span className="nav-icon">
                {isActive && <motion.span className="nav-active-bg" layoutId="navActiveBg" transition={{ type: 'spring', damping: 26, stiffness: 400 }} />}
                <Icon size={20} />
              </span>
              <AnimatePresence>
                {(sidebarOpen || onClose) && (
                  <motion.span className="nav-label" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    {t(labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="app-island-layout">
      
      {/* --- DESKTOP ISLAND SIDEBAR --- */}
      <aside className={`island-sidebar glass ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="island-brand">
          <motion.div className="brand-icon" whileHover={{ rotate: 15, scale: 1.1 }}>
            <Zap size={22} />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span className="brand-name" initial={{ opacity: 0, w: 0 }} animate={{ opacity: 1, w: 'auto' }} exit={{ opacity: 0, w: 0 }}>
                Zenith Spend
              </motion.span>
            )}
          </AnimatePresence>
          <button className="collapse-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <motion.span animate={{ rotate: sidebarOpen ? 180 : 0 }}><ChevronRight size={16} /></motion.span>
          </button>
        </div>

        {/* User Switcher (Island Style) */}
        <div className="island-user" onClick={() => { if (!sidebarOpen) setSidebarOpen(true); setUserMenuOpen(o => !o); }}>
          <div className="user-avatar" style={{ background: avatarColor }}>{avatar}</div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div className="user-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="u-name">{user?.username || 'User'}</p>
                <p className="u-role">{currencyInfo?.code} · {LANGUAGES[lang]?.name}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Island Dropdown */}
          <AnimatePresence>
            {userMenuOpen && sidebarOpen && (
              <motion.div className="island-dropdown glass"
                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
              >
                <p className="drp-label">Switch Profile</p>
                {allUsers.map(u => (
                  <motion.button key={u.id} className={`drp-btn ${u.id === USER_ID ? 'active' : ''}`} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }} onMouseDown={(e) => { e.stopPropagation(); switchUser(u.id); setUserMenuOpen(false); }}>
                    <span className="drp-avatar" style={{ background: u.profile_color || '#7c3aed' }}>{u.profile_avatar || '😊'}</span>
                    <div className="drp-txt">
                      <span>{u.username}</span>
                      <small>{u.currency}</small>
                    </div>
                    {u.id === USER_ID && <Check size={14} className="drp-chk" />}
                  </motion.button>
                ))}
                <div className="drp-div"></div>
                <NavLink to="/settings" className="drp-link" onClick={() => setUserMenuOpen(false)}>
                  <Plus size={14} /> Manage Users
                </NavLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="island-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `inav-item ${isActive ? 'active' : ''}`}>
               {({ isActive }) => (
                 <>
                   <Icon size={20} className="inav-icon" />
                   <AnimatePresence>{sidebarOpen && <motion.span className="inav-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{t(labelKey)}</motion.span>}</AnimatePresence>
                   {isActive && <motion.div className="inav-active-pill" layoutId="islandActive" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />}
                 </>
               )}
            </NavLink>
          ))}
        </nav>

        <div className="island-footer">
          <NavLink to="/settings" className={({ isActive }) => `inav-item ${isActive ? 'active' : ''}`}>
             <Settings size={20} className="inav-icon" />
             <AnimatePresence>{sidebarOpen && <motion.span className="inav-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{t('settings')}</motion.span>}</AnimatePresence>
          </NavLink>
        </div>
      </aside>

      {/* --- MAIN CANVAS --- */}
      <main className="island-main">
        <header className="island-header glass">
          <div className="ih-left">
            <div className="ih-titles">
              <h1>{pageTitle}</h1>
              <p>{t('track_plan_grow')}</p>
            </div>
          </div>

          <div className="ih-right">
            {/* Lang */}
            <div style={{ position: 'relative' }}>
              <button className="ibtn" onClick={() => setShowLangMenu(!showLangMenu)}>{LANGUAGES[lang]?.flag}</button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div className="island-dropdown glass" style={{ right: 0, left: 'auto', minWidth: 160 }}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
                  >
                    <p className="drp-label">Language</p>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                      <button key={code} className={`drp-btn ${lang === code ? 'active' : ''}`} onClick={() => { setLanguage(code); setShowLangMenu(false); }}>
                        {info.flag} {info.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="ibtn" onClick={() => setShowConverter(true)}>💱</button>
            <button className="ibtn" onClick={toggleTheme}>
              <AnimatePresence mode="wait"><motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>{theme === 'dark' ? '☀️' : '🌙'}</motion.span></AnimatePresence>
            </button>
            <button className="ibtn alert-btn" onClick={() => setShowAlerts(true)}>
              <Bell size={20} />
              {urgentAlerts > 0 && <span className="alert-badge">{urgentAlerts}</span>}
            </button>

            <div className="ih-balance">
              <TrendingUp size={16} />
              <span>{currencyInfo?.symbol || '₹'}{parseFloat(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="ih-avatar" style={{ background: avatarColor }}>{avatar}</div>
          </div>
        </header>

        <div className="island-content-wrapper">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="island-page"
              initial={{ opacity: 0, y: 20, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- MOBILE BOTTOM DOCK --- */}
      <nav className="mobile-bottom-dock glass">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <motion.div className="dock-icon-wrapper" whileTap={{ scale: 0.85 }}>
                  <Icon size={22} className="dock-icon" />
                  {isActive && <motion.div className="dock-active-dot" layoutId="dockActive" />}
                </motion.div>
              </>
            )}
          </NavLink>
        ))}
        <NavLink to="/settings" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <motion.div className="dock-icon-wrapper" whileTap={{ scale: 0.85 }}>
              <Settings size={22} className="dock-icon" />
              {isActive && <motion.div className="dock-active-dot" layoutId="dockActive" />}
            </motion.div>
          )}
        </NavLink>
      </nav>

      {/* Modals & Clickaways */}
      <AnimatePresence>
        {showConverter && <CurrencyConverter onClose={() => setShowConverter(false)} />}
        {showAlerts && <AlertsCenter alerts={alerts} onClose={() => setShowAlerts(false)} />}
      </AnimatePresence>
      {(userMenuOpen || showLangMenu) && <div className="click-away-overlay" onMouseDown={() => { setUserMenuOpen(false); setShowLangMenu(false); }} />}
    </div>
  );
}
