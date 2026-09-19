-- Rita Samothraki - i18n support + bulk import metadata
-- Run this in your Supabase SQL Editor

-- 1. English columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS about_text_en TEXT;

-- 2. Bulk import metadata (source + external id to avoid duplicates)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS listings_source_external_id_idx
  ON listings (source, external_id)
  WHERE external_id IS NOT NULL;

-- 3. Backfill English names for the default categories
UPDATE categories SET name_en = 'House with Plot' WHERE slug = 'me-oikopedo' AND name_en IS NULL;
UPDATE categories SET name_en = 'Agricultural Land' WHERE slug = 'agrotemaxio' AND name_en IS NULL;
UPDATE categories SET name_en = 'Detached House' WHERE slug = 'monokatikia' AND name_en IS NULL;
UPDATE categories SET name_en = 'Apartment' WHERE slug = 'diamerisma' AND name_en IS NULL;
UPDATE categories SET name_en = 'Building' WHERE slug = 'ktirio' AND name_en IS NULL;
