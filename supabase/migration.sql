-- Rita Samothraki - Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Office Settings
CREATE TABLE office_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Rita Samothraki',
  logo_url TEXT,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  about_text TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE office_settings ENABLE ROW LEVEL SECURITY;

-- Public read, admin write
CREATE POLICY "Public can view office settings" ON office_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert office settings" ON office_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update office settings" ON office_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete office settings" ON office_settings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default office settings
INSERT INTO office_settings (name) VALUES ('Rita Samothraki');

-- 2. Categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_el TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agora', 'enoikiasi', 'poulithike')),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO categories (name_el, slug, type) VALUES
  -- Αγορά
  ('Με Οικόπεδο', 'me-oikopedo', 'agora'),
  ('Αγροτεμάχιο', 'agrotemaxio', 'agora'),
  ('Μονοκατοικία', 'monokatikia', 'agora'),
  ('Διαμέρισμα', 'diamerisma', 'agora'),
  ('Κτήριο', 'ktirio', 'agora'),
  -- Ενοικίαση
  ('Μονοκατοικία', 'monokatikia', 'enoikiasi'),
  ('Διαμέρισμα', 'diamerisma', 'enoikiasi'),
  -- Πουλήθηκε
  ('Με Οικόπεδο', 'me-oikopedo', 'poulithike'),
  ('Αγροτεμάχιο', 'agrotemaxio', 'poulithike'),
  ('Μονοκατοικία', 'monokatikia', 'poulithike'),
  ('Διαμέρισμα', 'diamerisma', 'poulithike'),
  ('Κτήριο', 'ktirio', 'poulithike');

-- 3. Listings
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  phone TEXT DEFAULT '',
  youtube_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view listings" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage listings" ON listings
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Listing Images
CREATE TABLE listing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view listing images" ON listing_images
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage listing images" ON listing_images
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Create storage buckets (run in Supabase Storage section)
-- Bucket: 'listings' - for listing images
-- Bucket: 'office' - for office logo

-- 6. Auto-update updated_at on listings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
