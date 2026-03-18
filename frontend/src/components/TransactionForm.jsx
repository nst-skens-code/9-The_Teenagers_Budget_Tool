import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { AppContext } from '../App';
import '../pages/SharedPage.scss';

const CATEGORIES = {
  income: ['Allowance', 'Job', 'Gift', 'Sale', 'Other'],
  expense: ['Food', 'Games', 'Clothes', 'Subscriptions', 'Tech', 'Transport', 'Other']
};

export default function TransactionForm({ onClose, onSubmit, initialData = null }) {
  const { currencyInfo } = useContext(AppContext);
  const currSymbol = currencyInfo?.symbol || '₹';
  const [type, setType] = useState(initialData ? initialData.type : 'expense');
  const [amount, setAmount] = useState(initialData ? initialData.amount : '');
  const [category, setCategory] = useState(initialData ? initialData.category : CATEGORIES.expense[0]);
  const [note, setNote] = useState(initialData?.note || '');
  
  // Format current date to YYYY-MM-DD for date input
  const initialDate = initialData?.date 
    ? new Date(initialData.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState('');

  // Update categories when type changes
  useEffect(() => {
    if (!initialData || type !== initialData.type) {
      setCategory(CATEGORIES[type][0]);
    }
  }, [type, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    onSubmit({ 
      id: initialData?.id, // include ID if editing
      type, amount: amt, category, note: note.trim(), date 
    });
  };

  const isExpense = type === 'expense';

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-box glass"
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: isExpense ? '0 8px 32px rgba(239, 68, 68, 0.15)' : '0 8px 32px rgba(16, 185, 129, 0.15)',
          borderTop: `4px solid ${isExpense ? 'var(--danger)' : 'var(--success)'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {initialData ? '✍️ Edit Transaction' : '✨ New Transaction'}
          </h3>
          <motion.button 
            className="icon-btn" 
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={18} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="feedback-msg error"
            >
              {error}
            </motion.div>
          )}

          {/* Type Toggle */}
          <div className="type-toggle" style={{ display: 'flex', background: 'var(--glass-1)', borderRadius: 12, padding: 4, position: 'relative' }}>
            {['expense', 'income'].map(t => (
              <button
                key={t} type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
                  cursor: 'pointer', zIndex: 1, color: type === t ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', transition: 'color 0.2s'
                }}
              >
                {t}
              </button>
            ))}
            <motion.div
              style={{
                position: 'absolute', top: 4, bottom: 4, width: 'calc(50% - 4px)',
                background: isExpense ? 'var(--danger)' : 'var(--success)',
                borderRadius: 8, zIndex: 0
              }}
              animate={{ left: isExpense ? 4 : 'calc(50%)' }}
              transition={{ type: 'spring', damping: 26, stiffness: 350 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 700 }}>{currSymbol}</span>
                <input 
                  type="text" inputMode="decimal" value={amount}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                    setAmount(val);
                  }}
                  placeholder="0.00" autoFocus
                  style={{ paddingLeft: 28, fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Date</label>
              <input 
                type="date" value={date}
                onChange={e => setDate(e.target.value)}
                style={{ fontSize: '0.9rem', fontWeight: 600, colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Description (Optional)</label>
            <input 
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="What was this for?"
              maxLength={60}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Check size={16} /> {initialData ? 'Save Changes' : `Add ${initialData ? '' : type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
