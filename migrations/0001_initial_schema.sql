-- Migration: 0001_initial_schema
-- Description: Initial database schema for LW-link application
-- Created: 2024-01-01

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- users: Core user authentication and information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- profiles: User public profile data
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  team TEXT,
  company TEXT,
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'light', 'dark', 'minimal', 'gradient')),
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_style TEXT DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'square', 'pill')),
  font_family TEXT DEFAULT 'system-ui',
  text_alignment TEXT DEFAULT 'center' CHECK (text_alignment IN ('left', 'center', 'right')),
  avatar_shape TEXT DEFAULT 'circle' CHECK (avatar_shape IN ('circle', 'square', 'rounded')),
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- links: User's link entries
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  thumbnail TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- analytics_events: Tracking events for profile views and link clicks
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id TEXT REFERENCES links(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'link_click')),
  user_agent TEXT,
  referrer TEXT,
  ip_hash TEXT, -- SHA-256 hashed IP for privacy
  country_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sessions: User sessions for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_published ON profiles(published);

CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_position ON links(user_id, position);
CREATE INDEX IF NOT EXISTS idx_links_enabled ON links(enabled);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_link_user ON analytics_events(link_id, user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users 
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_profiles_timestamp 
AFTER UPDATE ON profiles 
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_links_timestamp 
AFTER UPDATE ON links 
BEGIN
  UPDATE links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert initial admin user for development
INSERT OR IGNORE INTO users (id, email, username, display_name, role, status) VALUES
  ('00000000000000000000000000000000', 'admin@example.local', 'admin', 'Administrator', 'admin', 'active'),
  ('11111111111111111111111111111111', 'rizki@example.local', 'rizki', 'Rizki Faturahman', 'user', 'active');

-- Insert initial profiles for development users
INSERT OR IGNORE INTO profiles (user_id, bio, team, company, published) VALUES
  ('00000000000000000000000000000000', 'System Administrator for LW-link platform', 'Platform', 'Your Company', TRUE),
  ('11111111111111111111111111111111', 'DevOps Engineer & Cloud Specialist | Building scalable infrastructure and automation', 'Platform Engineering', 'Your Company', TRUE);

-- Insert sample links for development
INSERT OR IGNORE INTO links (user_id, title, url, icon, position, enabled) VALUES
  ('11111111111111111111111111111111', 'GitHub', 'https://github.com/rizki', 'github', 1, TRUE),
  ('11111111111111111111111111111111', 'LinkedIn', 'https://linkedin.com/in/rizki', 'linkedin', 2, TRUE),
  ('11111111111111111111111111111111', 'Portfolio', 'https://rizki.dev', 'globe', 3, TRUE),
  ('11111111111111111111111111111111', 'Blog', 'https://blog.rizki.dev', 'globe', 4, TRUE),
  ('11111111111111111111111111111111', 'Email', 'mailto:rizki@example.com', 'mail', 5, TRUE);

-- Print migration completion message
SELECT 'Migration 0001_initial_schema completed successfully' as message;