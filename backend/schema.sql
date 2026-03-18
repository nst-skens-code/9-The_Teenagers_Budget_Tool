-- ===================================================
-- Zenith Spend — Updated Schema (v2)
-- Run this to apply new columns to existing DB
-- ===================================================

CREATE DATABASE IF NOT EXISTS ZenithSpend;
USE ZenithSpend;

-- Users Table (extended)
CREATE TABLE IF NOT EXISTS Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    theme VARCHAR(20) DEFAULT 'dark',
    monthly_goal DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    profile_avatar VARCHAR(10) DEFAULT '😊',
    profile_color VARCHAR(20) DEFAULT '#7c3aed'
);

-- ALTERs for existing databases (safe — ADD COLUMN IF NOT EXISTS via try/catch in server)
-- These are here for reference; server.js handles them automatically on startup.

-- Transactions Table (extended)
CREATE TABLE IF NOT EXISTS Transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 3. Create Goals Table (for savings targets)
CREATE TABLE IF NOT EXISTS Goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    target DECIMAL(10,2) NOT NULL,
    saved DECIMAL(10,2) DEFAULT 0.00,
    color VARCHAR(20) DEFAULT '#7c3aed',
    icon VARCHAR(10) DEFAULT '🎯',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 4. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS Subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    cycle VARCHAR(20) DEFAULT 'monthly',
    color VARCHAR(20) DEFAULT '#7c3aed',
    icon VARCHAR(10) DEFAULT '💳',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 5. Insert Initial Dummy Users (no pre-populated balance or transactions)
INSERT IGNORE INTO Users (id, username, email, balance, theme, monthly_goal, currency, profile_avatar, profile_color)
VALUES 
  (1, 'My Account', 'user1@zenithspend.com', 0.00, 'dark', 0.00, 'USD', '😊', '#7c3aed'),
  (2, 'Savings Account', 'user2@zenithspend.com', 0.00, 'dark', 0.00, 'INR', '💼', '#06b6d4');
