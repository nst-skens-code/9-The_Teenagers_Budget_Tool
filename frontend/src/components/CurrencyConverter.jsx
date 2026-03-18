import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, RefreshCw, X, TrendingUp } from 'lucide-react';
import { CURRENCIES } from '../services/api';

// Exchange rates relative to INR (base = INR)
const RATES_TO_INR = {
  INR: 1,
  USD: 83.5,
  EUR: 90.2,
  GBP: 105.8,
  JPY: 0.56,
  CAD: 61.2,
  AUD: 53.8,
  SGD: 61.5,
  AED: 22.7,
  CHF: 95.0,
  CNY: 11.5,
  MXN: 4.9,
  BRL: 16.4,
  KRW: 0.063,
  THB: 2.35,
};

const ALL_CURRENCIES = {
  ...CURRENCIES,
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  MXN: { symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  KRW: { symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
};

function convert(amount, from, to) {
  if (!amount || isNaN(amount)) return 0;
  const inINR = Number(amount) * (RATES_TO_INR[from] || 1);
  return inINR / (RATES_TO_INR[to] || 1);
}

export default function CurrencyConverter({ onClose }) {
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [result, setResult] = useState(null);
  const [lastUpdated] = useState(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));

  useEffect(() => {
    const r = convert(amount, from, to);
    setResult(r);
  }, [amount, from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  const popularPairs = [
    { from: 'USD', to: 'INR' }, { from: 'EUR', to: 'INR' },
    { from: 'GBP', to: 'INR' }, { from: 'JPY', to: 'INR' },
    { from: 'AED', to: 'INR' }, { from: 'SGD', to: 'INR' },
  ];

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-box glass"
        initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 480, width: '100%', borderTop: '4px solid var(--brand-secondary)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
            <ArrowLeftRight size={20} color="var(--brand-secondary)" /> Currency Converter
          </h3>
          <motion.button className="icon-btn" onClick={onClose} whileHover={{ rotate: 90, scale: 1.1 }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Amount Input */}
        <div className="form-field" style={{ marginBottom: 16 }}>
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount..."
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
            autoFocus
          />
        </div>

        {/* From / Swap / To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
            <label>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}>
              {Object.entries(ALL_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>{info.flag} {code} – {info.name}</option>
              ))}
            </select>
          </div>

          <motion.button
            onClick={swap}
            whileHover={{ rotate: 180, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--glass-border)',
              background: 'var(--glass-2)', cursor: 'pointer', color: 'var(--brand-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 20
            }}
          >
            <RefreshCw size={16} />
          </motion.button>

          <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
            <label>To</label>
            <select value={to} onChange={e => setTo(e.target.value)}>
              {Object.entries(ALL_CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>{info.flag} {code} – {info.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        <motion.div
          key={result}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(124,58,237,0.12))',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 20, textAlign: 'center'
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6 }}>
            {ALL_CURRENCIES[from]?.flag} {Number(amount || 0).toLocaleString()} {from} equals
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-secondary)', fontFamily: "'Space Grotesk'" }}>
            {ALL_CURRENCIES[to]?.symbol}{result?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6 }}>
            1 {from} = {ALL_CURRENCIES[to]?.symbol}{convert(1, from, to).toFixed(4)} {to}
          </p>
        </motion.div>

        {/* Popular Pairs */}
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            Popular INR Rates (indicative)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {popularPairs.map(pair => (
              <motion.button
                key={`${pair.from}-${pair.to}`}
                whileHover={{ scale: 1.04 }}
                onClick={() => { setFrom(pair.from); setTo(pair.to); setAmount('1'); }}
                style={{
                  background: (from === pair.from && to === pair.to) ? 'rgba(124,58,237,0.2)' : 'var(--glass-1)',
                  border: `1px solid ${(from === pair.from && to === pair.to) ? 'var(--brand-primary)' : 'var(--glass-border)'}`,
                  borderRadius: 10, padding: '8px 6px', cursor: 'pointer', color: 'var(--text-primary)'
                }}
              >
                <p style={{ fontSize: '0.7rem', fontWeight: 700 }}>{ALL_CURRENCIES[pair.from]?.flag} {pair.from}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  = {ALL_CURRENCIES[pair.to]?.symbol}{convert(1, pair.from, pair.to).toFixed(2)}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 14 }}>
          <TrendingUp size={10} style={{ marginRight: 4 }} />
          Indicative rates · Last updated: {lastUpdated}
        </p>
      </motion.div>
    </motion.div>
  );
}
