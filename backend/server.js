const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const excel = require('exceljs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Startup: Add new columns if they don't exist ───────────────────────────
async function runMigrations() {
  const migrations = [
    `ALTER TABLE Users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR'`,
    `ALTER TABLE Users ADD COLUMN IF NOT EXISTS profile_avatar VARCHAR(10) DEFAULT '😊'`,
    `ALTER TABLE Users ADD COLUMN IF NOT EXISTS profile_color VARCHAR(20) DEFAULT '#7c3aed'`,
    `ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS note VARCHAR(255) DEFAULT NULL`,
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch (e) { /* column may already exist */ }
  }
  console.log('✅ DB migrations checked.');
}
runMigrations();

// ─── CURRENCY HELPERS ────────────────────────────────────────────────────────
const CURRENCIES = {
  USD: { symbol: '$', code: 'USD' },
  INR: { symbol: '₹', code: 'INR' },
  EUR: { symbol: '€', code: 'EUR' },
  GBP: { symbol: '£', code: 'GBP' },
  JPY: { symbol: '¥', code: 'JPY' },
  CAD: { symbol: 'CA$', code: 'CAD' },
  AUD: { symbol: 'A$', code: 'AUD' },
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// 1. Get all users (for user switcher)
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, balance, theme, monthly_goal, currency, profile_avatar, profile_color FROM Users ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create new user
app.post('/api/users', async (req, res) => {
  const { username, email, currency = 'INR', profile_avatar = '😊', profile_color = '#7c3aed' } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'username and email are required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO Users (username, email, balance, currency, profile_avatar, profile_color) VALUES (?, ?, 0, ?, ?, ?)',
      [username, email, currency, profile_avatar, profile_color]
    );
    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: error.message });
  }
});

// 3.5 Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM Transactions WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM Goals WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM Subscriptions WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM Users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update user settings (username, theme, monthly_goal, currency, profile_avatar, profile_color)
app.put('/api/users/:id/settings', async (req, res) => {
  const { username, theme, monthly_goal, currency, profile_avatar, profile_color } = req.body;
  try {
    await pool.query(
      'UPDATE Users SET username = ?, theme = ?, monthly_goal = ?, currency = ?, profile_avatar = ?, profile_color = ? WHERE id = ?',
      [username, theme, monthly_goal, currency || 'INR', profile_avatar || '😊', profile_color || '#7c3aed', req.params.id]
    );
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get user transactions
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Transactions WHERE user_id = ? ORDER BY date DESC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Add transaction
app.post('/api/transactions', async (req, res) => {
  const { user_id, type, category, amount, date, note } = req.body;
  try {
    let query, params;
    if (date) {
      query = 'INSERT INTO Transactions (user_id, type, category, amount, date, note) VALUES (?, ?, ?, ?, ?, ?)';
      params = [user_id, type, category, amount, new Date(date), note || null];
    } else {
      query = 'INSERT INTO Transactions (user_id, type, category, amount, note) VALUES (?, ?, ?, ?, ?)';
      params = [user_id, type, category, amount, note || null];
    }
    const [result] = await pool.query(query, params);
    const modifier = type === 'income' ? amount : -amount;
    await pool.query('UPDATE Users SET balance = balance + ? WHERE id = ?', [modifier, user_id]);
    res.status(201).json({ id: result.insertId, message: 'Transaction added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Edit transaction (amount, category, note, date, type)
app.put('/api/transactions/:id', async (req, res) => {
  const { amount, category, note, date, type } = req.body;
  try {
    // Retrieve original transaction to reverse its balance effect
    const [orig] = await pool.query('SELECT * FROM Transactions WHERE id = ?', [req.params.id]);
    if (!orig.length) return res.status(404).json({ error: 'Transaction not found' });
    const t = orig[0];

    // Reverse old amount
    const reverseModifier = t.type === 'income' ? -Number(t.amount) : Number(t.amount);
    
    const newType = type || t.type;
    // Apply new amount based on potentially new type
    const newModifier = newType === 'income' ? Number(amount) : -Number(amount);

    await pool.query(
      'UPDATE Transactions SET type = ?, amount = ?, category = ?, note = ?, date = ? WHERE id = ?',
      [newType, amount, category || t.category, note || null, date ? new Date(date) : t.date, req.params.id]
    );
    await pool.query(
      'UPDATE Users SET balance = balance + ? WHERE id = ?',
      [reverseModifier + newModifier, t.user_id]
    );
    res.json({ message: 'Transaction updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const [trans] = await pool.query('SELECT amount, type, user_id FROM Transactions WHERE id = ?', [req.params.id]);
    if (!trans.length) return res.status(404).json({ error: 'Transaction not found' });
    const { amount, type, user_id } = trans[0];
    const modifier = type === 'income' ? -amount : amount;
    await pool.query('UPDATE Users SET balance = balance + ? WHERE id = ?', [modifier, user_id]);
    await pool.query('DELETE FROM Transactions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. RESET — delete all transactions, goals, subscriptions, and reset balance to 0
app.post('/api/users/:id/reset', async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM Transactions WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM Goals WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM Subscriptions WHERE user_id = ?', [userId]);
    await pool.query('UPDATE Users SET balance = 0 WHERE id = ?', [userId]);
    res.json({ message: 'Account reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GOALS API ---

// G1. Get all goals for a user
app.get('/api/goals/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Goals WHERE user_id = ? ORDER BY created_at ASC', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G2. Add a new goal
app.post('/api/goals', async (req, res) => {
  const { user_id, name, target, saved, color, icon } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Goals (user_id, name, target, saved, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, name, target, saved || 0.00, color, icon]
    );
    res.json({ id: result.insertId, message: 'Goal created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G3. Update goal saved amount
app.put('/api/goals/:id', async (req, res) => {
  try {
    await pool.query('UPDATE Goals SET saved = ? WHERE id = ?', [req.body.saved, req.params.id]);
    res.json({ message: 'Goal updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// G4. Delete a goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Goals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SUBSCRIPTIONS API ---

// S1. Get all subscriptions for a user
app.get('/api/subscriptions/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Subscriptions WHERE user_id = ? ORDER BY created_at ASC', [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// S2. Add a new subscription
app.post('/api/subscriptions', async (req, res) => {
  const { user_id, name, amount, cycle, color, icon } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Subscriptions (user_id, name, amount, cycle, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, name, amount, cycle || 'monthly', color, icon]
    );
    res.json({ id: result.insertId, message: 'Subscription created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// S3. Delete a subscription
app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Subscriptions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subscription deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Export to Excel
app.get('/api/export/:userId', async (req, res) => {
  try {
    const [userRows] = await pool.query('SELECT * FROM Users WHERE id = ?', [req.params.userId]);
    const user = userRows[0] || {};
    const currency = user.currency || 'USD';
    const currencySymbol = (CURRENCIES[currency] || CURRENCIES.USD).symbol;

    const [transactions] = await pool.query(
      'SELECT * FROM Transactions WHERE user_id = ? ORDER BY date DESC',
      [req.params.userId]
    );

    const workbook = new excel.Workbook();
    workbook.creator = 'Zenith Spend';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Transactions', { pageSetup: { fitToPage: true } });
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 22 },
      { header: 'Note', key: 'note', width: 32 },
      { header: `Amount (${currency})`, key: 'amount', width: 16 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    headerRow.height = 22;

    transactions.forEach(t => {
      const row = ws.addRow({
        id: t.id,
        date: new Date(t.date).toLocaleString('en-IN'),
        type: t.type.toUpperCase(),
        category: t.category,
        note: t.note || '',
        amount: `${currencySymbol}${parseFloat(t.amount).toFixed(2)}`,
      });
      row.getCell('amount').font = {
        bold: true,
        color: { argb: t.type === 'income' ? 'FF10B981' : 'FFEF4444' }
      };
    });

    ws.eachRow(row => row.eachCell(cell => {
      cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ZenithSpend_${user.username || 'Report'}.xlsx`);
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Zenith Spend API running on port ${PORT}`);
});
