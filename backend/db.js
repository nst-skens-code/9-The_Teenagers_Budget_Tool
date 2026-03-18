const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ZenithSpend',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: Test the connection when the app starts
pool.getConnection()
  .then(connection => {
    console.log('✅ Successfully connected to the MySQL Database.');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Failed to connect to the MySQL database:', error.message);
    console.log('💡 Note: Ensure MySQL is running and credentials in .env are correct.');
  });

module.exports = pool;
