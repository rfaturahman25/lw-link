-- Migration: 0010_add_profile_header_style
-- Description: Header style presets for the public profile (classic/hero/banner/shape)
--   plus an optional banner image URL.
-- Backward compatible: existing rows get header_style='classic' and banner_url=NULL,
--   which renders exactly like the current profile header. Additive columns only.

ALTER TABLE profiles ADD COLUMN header_style TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE profiles ADD COLUMN banner_url TEXT;

SELECT 'Migration 0010_add_profile_header_style completed successfully' as message;
