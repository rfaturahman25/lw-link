-- Migration: 0004_add_sections
-- Description: Add sections/categories for links

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_user_position ON sections(user_id, position);

-- Add section_id to links
ALTER TABLE links ADD COLUMN section_id TEXT REFERENCES sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_links_section_id ON links(section_id);

-- Trigger for sections updated_at
CREATE TRIGGER IF NOT EXISTS update_sections_timestamp 
AFTER UPDATE ON sections 
BEGIN
  UPDATE sections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
