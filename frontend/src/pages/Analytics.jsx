import React, { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../App';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import './SharedPage.scss';

const PIE_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const { transactions, theme, fmt } = useContext(AppContext);
  const isDark = theme === 'dark';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(10,10,26,0.97)' : 'rgba(255,255,255,0.97)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.2)'}`,
    borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  };

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { name: key, income: 0, expense: 0, savings: 0 };
      if (t.type === 'income') map[key].income += Number(t.amount);
      else map[key].expense += Number(t.amount);
    });
    Object.values(map).forEach(m => { m.savings = parseFloat((m.income - m.expense).toFixed(2)); });
    return Object.values(map).slice(-6);
  }, [transactions]);

  const catData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [transactions]);

  const savingsTrend = useMemo(() => {
    return monthlyData.map(m => ({ name: m.name, savings: m.savings }));
  }, [monthlyData]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, c) => a + Number(c.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + Number(c.amount), 0);
  const avgTx = transactions.length ? ((totalIncome + totalExpense) / transactions.length).toFixed(2) : 0;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  const summaryTiles = [
    { label: 'Total Transactions', value: transactions.length, color: '#7c3aed' },
    { label: 'Avg Transaction', value: fmt(avgTx), color: '#06b6d4' },
    { label: 'Savings Rate', value: `${savingsRate}%`, color: '#10b981' },
    { label: 'Top Expense', value: catData[0]?.name || 'N/A', color: '#ef4444' },
  ];

  return (
    <div className="shared-page">
      <div className="spage-header">
        <div className="spage-title"><h2>Analytics</h2><span className="badge">Insights</span></div>
      </div>

      {/* Summary Tiles */}
      <div className="analytics-summary">
        {summaryTiles.map((s, i) => (
          <motion.div key={i} className="summary-tile glass" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <p style={{ color: s.color, fontSize: '1.65rem', fontWeight: 800, fontFamily: "'Space Grotesk'" }}>{s.value}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6, fontWeight: 500 }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="analytics-charts">
        {/* Monthly Bar Chart */}
        <motion.div className="chart-card glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="chart-header"><h3>Monthly Overview</h3><span className="chart-badge">Last 6 months</span></div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => fmt(val)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
                <Bar dataKey="savings" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Savings" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Not enough data yet.</div>}
        </motion.div>

        {/* Expense Pie Chart */}
        <motion.div className="chart-card glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="chart-header"><h3>Expense Breakdown</h3><span className="chart-badge">By Category</span></div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" animationBegin={300} animationDuration={800}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => fmt(val)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">No expense data yet.</div>}
        </motion.div>

        {/* Savings Trend Line Chart */}
        <motion.div className="chart-card glass" style={{ gridColumn: '1 / -1' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="chart-header"><h3>Savings Trend</h3><span className="chart-badge">Monthly Net</span></div>
          {savingsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={savingsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [fmt(val), 'Net Savings']} />
                <Area
                  type="monotone" dataKey="savings" stroke="#7c3aed"
                  fill="url(#gSavings)" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7c3aed', stroke: isDark ? '#0f0f2e' : '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty">Add transactions across multiple months to see the trend.</div>}
        </motion.div>
      </div>
    </div>
  );
}
