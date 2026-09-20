-- Migration: 0007_add_profile_socials_and_theme_config
-- Description: Add structured social links and a complete public-profile color system

ALTER TABLE profiles ADD COLUMN theme_config TEXT;

CREATE TABLE profile_social_links (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  value TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profile_social_links_user_position ON profile_social_links(user_id, position);

CREATE TRIGGER update_profile_social_links_timestamp
AFTER UPDATE ON profile_social_links
BEGIN
  UPDATE profile_social_links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
