-- Migration: 0002_add_password_hash
-- Description: Add password_hash to users for username/password login

ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Set default passwords for seed users (SHA-256 of password)
-- admin@example.local / admin -> admin123
-- rizki@example.local / rizki -> rizki123
UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE username = 'admin';
UPDATE users SET password_hash = '9075f3100605afe2b6713a2126ad284ad7e3a866d4fa2ab1a8d3b2c2aba2e3c0' WHERE username = 'rizki';

-- Create index for password lookup (optional)
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash);
