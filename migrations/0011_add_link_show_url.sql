-- Migration: 0011_add_link_show_url
-- Description: Per-link option to show/hide the URL subtitle on the public profile.
-- Backward compatible: existing links default to showing the URL (show_url = 1).

ALTER TABLE links ADD COLUMN show_url INTEGER NOT NULL DEFAULT 1;

SELECT 'Migration 0011_add_link_show_url completed successfully' as message;
