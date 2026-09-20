-- Migration: 0006_remove_profile_team_company
-- Description: Remove deprecated team and company fields from profiles

PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS update_profiles_timestamp;

CREATE TABLE profiles_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'light', 'dark', 'minimal', 'gradient')),
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_style TEXT DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'square', 'pill')),
  font_family TEXT DEFAULT 'system-ui',
  text_alignment TEXT DEFAULT 'center' CHECK (text_alignment IN ('left', 'center', 'right')),
  avatar_shape TEXT DEFAULT 'circle' CHECK (avatar_shape IN ('circle', 'square', 'rounded')),
  color_palette TEXT DEFAULT 'ocean' CHECK (color_palette IN ('ocean', 'sunset', 'forest', 'berry', 'midnight', 'candy', 'golden', 'monochrome')),
  logo_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO profiles_new (
  id, user_id, bio, theme, background_color, text_color, button_style,
  font_family, text_alignment, avatar_shape, color_palette, logo_url,
  published, created_at, updated_at
)
SELECT
  id, user_id, bio, theme, background_color, text_color, button_style,
  font_family, text_alignment, avatar_shape, color_palette, logo_url,
  published, created_at, updated_at
FROM profiles;

DROP TABLE profiles;
ALTER TABLE profiles_new RENAME TO profiles;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_published ON profiles(published);
CREATE INDEX IF NOT EXISTS idx_profiles_color_palette ON profiles(color_palette);

CREATE TRIGGER update_profiles_timestamp
AFTER UPDATE ON profiles
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

PRAGMA foreign_keys = ON;
