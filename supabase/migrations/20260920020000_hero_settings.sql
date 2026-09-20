-- Rita Samothraki - Hero slideshow global settings
-- Run this in your Supabase SQL Editor

ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS hero_duration_ms INTEGER DEFAULT 6000;
ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS hero_effect TEXT DEFAULT 'fade';
