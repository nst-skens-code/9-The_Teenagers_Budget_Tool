import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Target,
  Download, Plus, ArrowUpRight, ArrowDownRight,
  Wallet, Sparkles, FileText, Zap, Brain, AlertTriangle
} from 'lucide-react';
import { AppContext } from '../App';
import { api } from '../services/api';
import TransactionForm from '../components/TransactionForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.scss';

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 260 } }
};
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const PIE_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function Dashboard() {
  const { user, transactions, theme, addTransaction, deleteTransaction, USER_ID, fmt, t, insights, alerts } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);

  const income  = transactions.filter(t => t.type === 'income').reduce((a, c) => a + Number(c.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + Number(c.amount), 0);
  const balance = Number(user?.balance || 0);
  const savingsRate  = income > 0 ? (((income - expense) / income) * 100).toFixed(1) : 0;
  const rawProgress  = monthlyGoal > 0 ? ((income - expense) / monthlyGoal) * 100 : 0;
  const goalProgress = Math.max(0, Math.min(rawProgress, 100));
  const netSavings   = income - expense;

  const chartData = (() => {
    const map = {};
    [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(t => {
      const d = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[d]) map[d] = { name: d, income: 0, expense: 0 };
      if (t.type === 'income') map[d].income += Number(t.amount);
      else map[d].expense += Number(t.amount);
    });
    return Object.values(map).slice(-10);
  })();

  const catMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const pieData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const isDark = theme === 'dark';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(8,8,22,0.98)' : 'rgba(255,255,255,0.97)',
    border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}`,
    borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)'
  };

  const urgentAlerts = alerts.filter(a => a.type === 'danger').length;

  const StatCard = ({ icon: Icon, label, value, colorRgb, trend, trendVal, accentColor }) => (
    <motion.div variants={CARD_VARIANTS} className="stat-card glass">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: `rgba(${colorRgb}, 0.15)`, color: `rgb(${colorRgb})` }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value" style={{ color: accentColor || 'var(--text-primary)' }}>{value}</div>
      {trendVal !== undefined && (
        <div className={`stat-trend ${trend === 'up' ? 'positive' : 'negative'}`}>
          {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span>{trendVal}</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="bento-dashboard">
      {/* ── BENTO HEADER (Actions) ── */}
      <div className="bento-header">
        <motion.div className="bento-insight-pill" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <Sparkles size={14} />
          {transactions.length > 0 ? `${t('savings_rate')}: ${savingsRate}% · ${transactions.length} txns` : t('no_transactions')}
        </motion.div>
        <div className="bento-actions">
          <motion.button className="bbtn-sec" onClick={() => api.exportToExcel(USER_ID)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}><Download size={14} /> Export</motion.button>
          <motion.button className="bbtn-pri" onClick={() => setShowForm(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}><Plus size={14} /> Add</motion.button>
        </div>
      </div>

      {/* ── BENTO GRID CANVAS ── */}
      <motion.div className="bento-grid" variants={STAGGER} initial="hidden" animate="show">
        
        {/* TILE 1: HERO BALANCE (Span 2x1) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-hero glass">
          <div className="blob-glow"></div>
          <div className="bh-top">
            <span className="bh-label">Total Balance</span>
            <Wallet size={20} className="bh-icon" />
          </div>
          <div className="bh-mid">
            <h2>{fmt(balance)}</h2>
            <div className={`bh-trend ${balance >= 0 ? 'positive' : 'negative'}`}>
              {balance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>All time</span>
            </div>
          </div>
        </motion.div>

        {/* TILE 2: INCOME (Span 1x1) */}
        <StatCard icon={TrendingUp} label={t('income')} value={fmt(income)} colorRgb="16,185,129" trend="up" trendVal="Earned" accentColor="var(--success)" />

        {/* TILE 3: EXPENSE (Span 1x1) */}
        <StatCard icon={TrendingDown} label={t('spent')} value={fmt(expense)} colorRgb="239,68,68" trend="down" trendVal="Spent" accentColor="var(--danger)" />

        {/* TILE 4: RECENT TRANSACTIONS (Span 2x3 Tall) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-recent glass">
          <div className="bt-header">
            <h3>{t('recent_transactions')}</h3>
            <button className="bt-icon-btn" onClick={() => setShowForm(true)}><Plus size={16}/></button>
          </div>
          {transactions.length === 0 ? (
             <div className="bento-empty"><Wallet size={32} /> No transactions yet</div>
          ) : (
            <div className="bt-list">
              {transactions.slice(0, 8).map((tx, i) => (
                <div key={tx.id} className="bt-item">
                  <div className={`bt-icn ${tx.type}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="bt-info">
                    <span className="bt-cat">{tx.category}</span>
                    <span className="bt-date">{new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className={`bt-amt ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* TILE 5: MAIN AREA CHART (Span 3x2) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-chart glass">
          <div className="bt-header">
            <h3>Spending vs Income</h3>
            <span className="bt-badge">Daily Trend</span>
          </div>
          <div className="bt-chart-wrap">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => fmt(val)} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#gIn)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#gEx)" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="bento-empty">📊 Add data to see chart</div>}
          </div>
        </motion.div>

        {/* TILE 6: GOAL PROGRESS (Span 1x1) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-goal glass">
          <div className="bt-header">
            <h3>Savings Goal</h3>
            <Target size={16} className="bt-icon-muted" />
          </div>
          <div className="bg-hud">
            <span className="bg-pct">{goalProgress.toFixed(0)}%</span>
            <span className="bg-frac">{fmt(Math.max(0, netSavings))} / {fmt(monthlyGoal)}</span>
          </div>
          <div className="bg-track">
            <motion.div className="bg-fill" initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1.5, delay: 0.5 }}>
              <div className="bg-glow-dot"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* TILE 7: AI INSIGHTS (Span 2x1) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-ai glass">
          <div className="bt-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Brain size={16} color="var(--brand-primary)" /> {t('ai_insights')}</h3>
            {urgentAlerts > 0 && <span className="bt-badge danger">{urgentAlerts} Alerts</span>}
          </div>
          <div className="bai-list">
            {insights.length > 0 ? insights.slice(0, 2).map((ins, i) => (
              <div key={i} className="bai-item">
                <span className="bai-icn">{ins.icon}</span>
                <p>{ins.text}</p>
              </div>
            )) : <div className="bento-empty">Looking good — keep spending smart!</div>}
          </div>
        </motion.div>

        {/* TILE 8: PIE CHART (Span 1x1) */}
        <motion.div variants={CARD_VARIANTS} className="bento-tile bento-pie glass">
          <div className="bt-header">
            <h3>Breakdown</h3>
          </div>
          <div className="bt-pie-wrap">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val) => fmt(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="bento-empty">No expenses</div>}
          </div>
        </motion.div>

      </motion.div>

      <AnimatePresence>
        {showForm && <TransactionForm onClose={() => setShowForm(false)} onSubmit={async (tx) => { await addTransaction(tx); setShowForm(false); }} />}
      </AnimatePresence>
    </div>
  );
}
