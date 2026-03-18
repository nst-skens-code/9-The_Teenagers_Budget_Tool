import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, User, Users, Target, Moon, Sun, Download, CheckCircle, AlertCircle,
  Palette, Database, Plus, Settings, ShieldAlert, Globe, Bell, Zap, Smartphone, FileText, Trash2
} from 'lucide-react';
import { AppContext } from '../App';
import { CURRENCIES, AVATARS, AVATAR_COLORS, api } from '../services/api';
import { LANGUAGES } from '../services/i18n';
import { exportToPDF } from '../services/pdfExport';
import './SharedPage.scss';

export default function SettingsPage() {
  const {
    user, allUsers, theme, toggleTheme, setThemeDirect, refetch, USER_ID,
    resetAccount, createUser, switchUser, currencyInfo,
    lang, setLanguage, t, deferredPrompt, installPWA,
    transactions
  } = useContext(AppContext);

  const [username, setUsername]     = useState(user?.username || '');
  const [monthlyGoal, setMonthlyGoal] = useState(user?.monthly_goal || '');
  const [currency, setCurrency]     = useState(user?.currency || 'INR');
  const [avatar, setAvatar]         = useState(user?.profile_avatar || '😊');
  const [avatarColor, setAvatarColor] = useState(user?.profile_color || '#7c3aed');

  const [showAddUser, setShowAddUser]         = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userToDelete, setUserToDelete]       = useState(null);
  const [newUserName, setNewUserName]         = useState('');
  const [newUserEmail, setNewUserEmail]       = useState('');
  const [loading, setLoading]                 = useState(false);
  const [pdfLoading, setPdfLoading]           = useState(false);
  const [msg, setMsg]                         = useState(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setMonthlyGoal(user.monthly_goal || '');
      setCurrency(user.currency || 'INR');
      setAvatar(user.profile_avatar || '😊');
      setAvatarColor(user.profile_color || '#7c3aed');
    }
  }, [user?.id]);

  const save = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setMsg({ type: 'error', text: 'Display name cannot be empty.' }); return; }
    setLoading(true);
    try {
      await api.updateSettings(USER_ID, { username: username.trim(), theme, monthly_goal: monthlyGoal, currency, profile_avatar: avatar, profile_color: avatarColor });
      setMsg({ type: 'success', text: '✅ Settings saved successfully!' });
      await refetch();
    } catch {
      setMsg({ type: 'error', text: '❌ Failed to save. Is the backend running?' });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    try {
      const result = await createUser({ username: newUserName.trim(), email: newUserEmail.trim() });
      if (result && result.id) switchUser(result.id);
      setShowAddUser(false);
      setNewUserName(''); setNewUserEmail('');
      setMsg({ type: 'success', text: '✅ New account created and switched!' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: 'Error: ' + (err.response?.data?.error || err.message) });
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleReset = async () => {
    try {
      await resetAccount();
      setShowResetConfirm(false);
      setMsg({ type: 'success', text: '✅ Account completely reset.' });
      setTimeout(() => setMsg(null), 4000);
    } catch {
      alert('Error resetting account.');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete);
      await refetch();
      if (userToDelete === USER_ID) {
        window.location.href = '/'; // Hard reload to reset context
      } else {
        setUserToDelete(null);
        setMsg({ type: 'success', text: '✅ Account successfully removed.' });
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to remove user: ' + (err.response?.data?.error || err.message) });
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handlePDFExport = async () => {
    setPdfLoading(true);
    try {
      await exportToPDF(user, transactions, currencyInfo);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('profile');

  const TABS = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'preferences', icon: Settings, label: 'Preferences' },
    { id: 'language', icon: Globe, label: 'Language' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'users', icon: Users, label: 'Manage Users' },
    { id: 'data', icon: Database, label: 'Data & Security' },
  ];

  return (
    <div className="inbox-layout-page settings-page">
      <div className="inbox-header">
        <div className="ih-titles">
          <h2>{t('settings')}</h2>
          <span className="ih-badge">{TABS.find(t => t.id === activeTab)?.label}</span>
        </div>
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className={`feedback-msg ${msg.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="inbox-split-pane">
        
        {/* --- LEFT SIDEBAR (Tabs) --- */}
        <div className="inbox-list-pane glass" style={{ flex: '0 0 280px' }}>
          <div className="il-filters" style={{ padding: '24px 20px 12px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Categories</h3>
          </div>
          <div className="il-scrollable" style={{ padding: '12px', gap: '4px' }}>
            {TABS.map(tab => (
              <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(var(--brand-primary-rgb), 0.15), rgba(var(--brand-secondary-rgb), 0.05))' : 'transparent',
                  color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 800 : 600, fontSize: '0.95rem', transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id ? 'inset 2px 0 0 var(--brand-primary)' : 'none'
                }}>
                <tab.icon size={18} /> {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* --- RIGHT PANE (Content) --- */}
        <div className="inbox-detail-pane glass">
          <form onSubmit={save} className="idp-content" style={{ maxWidth: '800px', padding: '40px' }}>
            <AnimatePresence mode="wait">
              
              {/* Profile Config */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon income" style={{ width: 64, height: 64, marginBottom: 16 }}><User size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>{t('profile')}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure your personal identity within Zenith.</p>
                  </div>

                  <div className="idp-body">
                    <div style={{ display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap' }}>
                      <motion.div whileHover={{ scale: 1.05 }} style={{ width: 100, height: 100, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: `0 0 30px ${avatarColor}55`, flexShrink: 0 }}>
                        {avatar}
                      </motion.div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Choose Avatar</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {AVATARS.slice(0, 12).map(i => (
                              <button key={i} type="button" onClick={() => setAvatar(i)} style={{ width: 36, height: 36, borderRadius: 10, background: avatar === i ? 'var(--brand-primary)' : 'var(--glass-2)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '1.2rem', transition: 'all 0.2s', opacity: avatar === i ? 1 : 0.6 }}>{i}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Profile Color</label>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {AVATAR_COLORS.map(c => (
                              <button key={c} type="button" onClick={() => setAvatarColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: avatarColor === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', outline: avatarColor === c ? `3px solid ${c}` : 'none', boxShadow: avatarColor === c ? `0 0 16px ${c}` : 'none', transition: 'all 0.2s' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--glass-border)', margin: '10px 0' }} />

                    <div className="form-field"><label>{t('display_name')}</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" /></div>
                    <div className="form-field"><label>Email (read-only)</label><input value={user?.email || ''} readOnly style={{ opacity: 0.5 }} /></div>
                  </div>
                  
                  <div className="idp-actions">
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
                      <Save size={18} /> {loading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Preferences Config */}
              {activeTab === 'preferences' && (
                <motion.div key="prefs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon" style={{ width: 64, height: 64, marginBottom: 16, background: 'rgba(56,189,248,0.1)', color: 'var(--brand-secondary)', border: '1px solid rgba(56,189,248,0.3)' }}><Settings size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Preferences</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Set your regional currency and savings goals.</p>
                  </div>

                  <div className="idp-body">
                    <div className="form-field">
                      <label>{t('currency')}</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)}>
                        {Object.entries(CURRENCIES).map(([code, info]) => <option key={code} value={code}>{info.flag} {code} – {info.name} ({info.symbol})</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label><Target size={14}/> {t('monthly_goal')}</label>
                      <input type="number" value={monthlyGoal} onChange={e => setMonthlyGoal(e.target.value)} placeholder="e.g. 5000" min="0" step="1" />
                    </div>
                  </div>
                  
                  <div className="idp-actions">
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
                      <Save size={18} /> {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Language Config */}
              {activeTab === 'language' && (
                <motion.div key="lang" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon" style={{ width: 64, height: 64, marginBottom: 16, background: 'rgba(251,191,36,0.1)', color: 'var(--warning)', border: '1px solid rgba(251,191,36,0.3)' }}><Globe size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Language</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Zenith speaks your language.</p>
                  </div>

                  <div className="idp-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                      <motion.button key={code} type="button" onClick={() => setLanguage(code)} whileHover={{ x: 4, scale: 1.01 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, border: lang === code ? '2px solid var(--brand-primary)' : '1px solid var(--glass-border)', background: lang === code ? 'rgba(var(--brand-primary-rgb), 0.08)' : 'var(--surface-1)', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: lang === code ? 800 : 600, transition: 'all 0.2s', boxShadow: lang === code ? '0 8px 24px rgba(var(--brand-primary-rgb), 0.15)' : 'none' }}>
                        <span style={{ fontSize: '1.6rem' }}>{info.flag}</span>
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '1.1rem' }}>{info.name}</span>
                        {lang === code && <CheckCircle size={20} color="var(--brand-primary)" />}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Appearance Config */}
              {activeTab === 'appearance' && (
                <motion.div key="app" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon" style={{ width: 64, height: 64, marginBottom: 16, background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}><Palette size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>{t('appearance')}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Choose a theme that fits your vibe.</p>
                  </div>

                  <div className="idp-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, padding: '30px 20px' }}>
                    {[
                      { id: 'dark',   label: 'Dark',   icon: '🌙', bg: '#06060f', accent: '#a78bfa', sub: 'Deep Purple' },
                      { id: 'light',  label: 'Light',  icon: '☀️', bg: '#e8ecff', accent: '#7c3aed', sub: 'Frosted Glass' },
                      { id: 'amoled', label: 'AMOLED', icon: '⚡', bg: '#000000', accent: '#c084fc', sub: 'True Black' },
                    ].map(opt => (
                      <motion.button key={opt.id} type="button" whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setThemeDirect(opt.id); document.documentElement.setAttribute('data-theme', opt.id); }}
                        style={{ padding: '24px 16px', borderRadius: 20, border: theme === opt.id ? `2px solid ${opt.accent}` : '1px solid var(--glass-border)', background: opt.bg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all 0.25s', boxShadow: theme === opt.id ? `0 12px 32px ${opt.accent}44, inset 0 0 20px ${opt.accent}22` : 'var(--shadow-sm)', position: 'relative' }}>
                        <span style={{ fontSize: '2.4rem', filter: theme === opt.id ? `drop-shadow(0 0 16px ${opt.accent})` : 'none' }}>{opt.icon}</span>
                        <span style={{ color: opt.accent, fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>{opt.label}</span>
                        <span style={{ color: opt.accent, opacity: 0.7, fontSize: '0.8rem', fontWeight: 600 }}>{opt.sub}</span>
                        {theme === opt.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 12, right: 12 }}><CheckCircle size={18} color={opt.accent} /></motion.div>}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Users Config */}
              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon" style={{ width: 64, height: 64, marginBottom: 16, background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}><Users size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Manage Users</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Easily switch between household accounts.</p>
                  </div>

                  <div className="idp-body" style={{ padding: 0, background: 'none', border: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                      {allUsers.map(u => (
                        <motion.div key={u.id} whileHover={{ x: 4 }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: u.id === USER_ID ? 'linear-gradient(135deg, rgba(var(--brand-primary-rgb),0.15), rgba(var(--brand-secondary-rgb),0.05))' : 'var(--glass-2)', border: `1px solid ${u.id === USER_ID ? 'rgba(var(--brand-primary-rgb),0.4)' : 'var(--glass-border)'}`, boxShadow: u.id === USER_ID ? '0 8px 24px rgba(var(--brand-primary-rgb),0.1)' : 'none' }}>
                          <span style={{ fontSize: '1.4rem', width: 44, height: 44, borderRadius: '50%', background: u.profile_color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${u.profile_color}66` }}>{u.profile_avatar || '😊'}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{u.username}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{u.email}</p>
                          </div>
                          {u.id === USER_ID && <span style={{ fontSize: '0.75rem', background: 'var(--brand-primary)', color: 'white', padding: '4px 12px', borderRadius: 100, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active</span>}
                          {allUsers.length > 1 && (
                            <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setUserToDelete(u.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', marginLeft: 'auto' }}>
                              <Trash2 size={18} />
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <motion.button type="button" className="btn-secondary" onClick={() => setShowAddUser(true)} whileHover={{ scale: 1.02 }} style={{ width: '100%', justifyContent: 'center', padding: 18, borderStyle: 'dashed', borderWidth: 2, background: 'rgba(255,255,255,0.02)' }}>
                      <Plus size={18} /> {t('add_new_user')}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Data Security Config */}
              {activeTab === 'data' && (
                <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="idp-header" style={{ alignItems: 'flex-start', textAlign: 'left', marginBottom: 30 }}>
                    <div className="idp-hero-icon expense" style={{ width: 64, height: 64, marginBottom: 16 }}><Database size={28} /></div>
                    <h3 style={{ fontSize: '2rem', margin: '0 0 8px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Data & Security</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Export your data or permanently wipe your account.</p>
                  </div>

                  <div className="idp-body" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 30 }}>
                      <motion.button type="button" onClick={() => api.exportToExcel(USER_ID)} className="btn-secondary" whileHover={{ scale: 1.03, y: -2 }} style={{ flexDirection: 'column', gap: 12, padding: '24px 16px', background: 'var(--glass-2)' }}>
                        <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 12, color: 'var(--success)' }}><Download size={24} /></div>
                        <span style={{ fontWeight: 800 }}>Download Excel</span>
                      </motion.button>
                      <motion.button type="button" onClick={handlePDFExport} disabled={pdfLoading} className="btn-secondary" whileHover={{ scale: 1.03, y: -2 }} style={{ flexDirection: 'column', gap: 12, padding: '24px 16px', background: 'var(--glass-2)' }}>
                        <div style={{ padding: 12, background: 'rgba(56,189,248,0.1)', borderRadius: 12, color: 'var(--brand-secondary)' }}><FileText size={24} /></div>
                        <span style={{ fontWeight: 800 }}>{pdfLoading ? 'Generating...' : 'Download PDF'}</span>
                      </motion.button>
                    </div>

                    <div className="idp-section" style={{ background: 'rgba(239,68,68,0.05)', padding: 24, borderRadius: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
                      <h4 style={{ color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={20}/> Danger Zone</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>Permanently delete all your transactions, goals, and subscriptions. This action cannot be reversed.</p>
                      <motion.button type="button" className="btn-primary" onClick={() => setShowResetConfirm(true)} whileHover={{ scale: 1.02 }} style={{ background: 'var(--danger)', width: 'max-content' }}>
                        <ShieldAlert size={16} /> Factory Reset Account
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddUser(false)}>
            <motion.div className="modal-box glass" initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }} transition={{ type: 'spring', damping: 22 }} onClick={e => e.stopPropagation()}>
              <h3><Users size={20} /> Add Family Member</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>Create a completely separate account workspace.</p>
              <div className="form-field"><label>Display Name</label><input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Alex" autoFocus /></div>
              <div className="form-field"><label>Email Address</label><input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="alex@example.com" /></div>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={handleCreateUser}>Create Account</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetConfirm(false)}>
            <motion.div className="modal-box glass" initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }} transition={{ type: 'spring', damping: 22 }} onClick={e => e.stopPropagation()} style={{ borderColor: 'rgba(239,68,68,0.4)', boxShadow: '0 8px 32px rgba(239,68,68,0.2)' }}>
              <h3 style={{ color: 'var(--danger)' }}><ShieldAlert size={20} /> Confirm Factory Reset</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 16, lineHeight: 1.6 }}>
                You are about to permanently delete <strong>all data</strong> associated with your account. This includes transactions, goals, and subscriptions. This action cannot be undone. Are you absolutely sure?
              </p>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowResetConfirm(false)}>No, Keep Data</button>
                <button type="button" className="btn-primary" onClick={handleReset} style={{ background: 'var(--danger)' }}>Yes, Obliterate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserToDelete(null)}>
            <motion.div className="modal-box glass" initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }} transition={{ type: 'spring', damping: 22 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={20} /> Delete User Account?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 16, lineHeight: 1.6 }}>
                You are about to delete the user <strong>{allUsers.find(u => u.id === userToDelete)?.username}</strong> and all their financial data. This cannot be undone!
              </p>
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setUserToDelete(null)}>Cancel</button>
                <button type="button" className="btn-primary" onClick={confirmDeleteUser} style={{ background: 'var(--danger)' }}>Yes, Delete User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
