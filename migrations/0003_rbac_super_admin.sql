-- Migration: 0003_rbac_super_admin
-- Description: Add super_admin role, last_login_at, audit_logs for RBAC

-- 1. Recreate users table to update CHECK constraint for 3 roles + add last_login_at
-- SQLite can't alter CHECK, so recreate

PRAGMA foreign_keys=off;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (id, email, username, display_name, avatar_url, password_hash, role, status, last_login_at, created_at, updated_at)
SELECT id, email, username, display_name, avatar_url, password_hash, role, status, NULL, created_at, updated_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- recreate trigger
DROP TRIGGER IF EXISTS update_users_timestamp;
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users 
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

PRAGMA foreign_keys=on;

-- 3. Promote admin@lensawaktu.id to super_admin (first super admin)
UPDATE users SET role='super_admin' WHERE email='admin@lensawaktu.id';

-- 4. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_username TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_username TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 5. Clean legacy example users (will also be done via API, but keep as fallback)
-- DELETE FROM users WHERE email IN ('admin@example.local', 'rizki@example.local');
