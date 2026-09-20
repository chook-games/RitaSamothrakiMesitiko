-- Rita Samothraki - Hero slideshow + logo size
-- Run this in your Supabase SQL Editor

-- 1. Hero slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 6000,
  effect TEXT DEFAULT 'fade' CHECK (effect IN ('fade', 'slide', 'zoom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view hero slides" ON hero_slides;
CREATE POLICY "Public can view hero slides" ON hero_slides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage hero slides" ON hero_slides;
CREATE POLICY "Admin can manage hero slides" ON hero_slides
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Logo height (px) for header/footer logo
ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 40;
