-- Rita Samothraki - Services / Works showcase
-- Run this in your Supabase SQL Editor

-- 1. Work categories
CREATE TABLE IF NOT EXISTS work_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_el TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE work_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view work categories" ON work_categories;
CREATE POLICY "Public can view work categories" ON work_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage work categories" ON work_categories;
CREATE POLICY "Admin can manage work categories" ON work_categories
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Works (showcase items, not listings)
CREATE TABLE IF NOT EXISTS works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES work_categories(id) ON DELETE SET NULL,
  title_el TEXT DEFAULT '',
  title_en TEXT DEFAULT '',
  description_el TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view works" ON works;
CREATE POLICY "Public can view works" ON works
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage works" ON works;
CREATE POLICY "Admin can manage works" ON works
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Default categories
INSERT INTO work_categories (name_el, name_en, slug, "order") VALUES
  ('Τεχνικές Εργασίες', 'Technical Works', 'texnikes-ergasies', 1),
  ('Σιδεροκατασκευές', 'Metal Constructions', 'siderokataskeues', 2),
  ('Καθαρισμοί Οικοπέδων', 'Land Clearing', 'katharismoi-oikopedon', 3)
ON CONFLICT (slug) DO NOTHING;
