-- Migration: 0009_add_link_smart_type
-- Description: Foundation for Smart Links / Smart Content. Adds `type` and `metadata`
--   to links so a link can carry resolved content metadata (e.g. Google Maps location).
-- Backward compatible: existing rows get type='link' and metadata=NULL, so their URL,
--   rendering and analytics are unchanged. Additive columns only; no data is deleted.

ALTER TABLE links ADD COLUMN type TEXT NOT NULL DEFAULT 'link';
ALTER TABLE links ADD COLUMN metadata TEXT;

CREATE INDEX IF NOT EXISTS idx_links_user_type ON links(user_id, type);

SELECT 'Migration 0009_add_link_smart_type completed successfully' as message;
