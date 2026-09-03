-- Migration: 0005_add_color_palette_and_logo
-- Description: Add color palette and logo URL fields to profiles table

-- Add color_palette column (enum-like with CHECK constraint)
ALTER TABLE profiles ADD COLUMN color_palette TEXT DEFAULT 'ocean' CHECK (color_palette IN ('ocean', 'sunset', 'forest', 'berry', 'midnight', 'candy', 'golden', 'monochrome'));

-- Add logo_url column
ALTER TABLE profiles ADD COLUMN logo_url TEXT;

-- Create index for color_palette if needed for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_color_palette ON profiles(color_palette);

SELECT 'Migration 0005_add_color_palette_and_logo completed successfully' as message;
