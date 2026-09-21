-- Migration: 0013_add_link_bold
-- Description: Per-link bold title toggle for the public profile.
-- Backward compatible: existing links default to non-bold.

ALTER TABLE links ADD COLUMN bold INTEGER NOT NULL DEFAULT 0;

SELECT 'Migration 0013_add_link_bold completed successfully' as message;
