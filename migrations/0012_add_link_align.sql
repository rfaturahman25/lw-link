-- Migration: 0012_add_link_align
-- Description: Per-link text alignment (left/center/right) for the public profile.
-- Backward compatible: existing links default to left.

ALTER TABLE links ADD COLUMN align TEXT NOT NULL DEFAULT 'left';

SELECT 'Migration 0012_add_link_align completed successfully' as message;
