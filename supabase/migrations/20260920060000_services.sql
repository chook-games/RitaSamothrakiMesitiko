-- Rita Samothraki - Services (Τεχνικά / Οικοδομικά)
-- Run this in your Supabase SQL Editor
-- (If you already created the older "works" tables, they are dropped here.)

DROP TABLE IF EXISTS works CASCADE;
DROP TABLE IF EXISTS work_categories CASCADE;

-- 1. Sections (e.g. Τεχνικά, Οικοδομικά)
CREATE TABLE IF NOT EXISTS service_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_el TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view service sections" ON service_sections;
CREATE POLICY "Public can view service sections" ON service_sections
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage service sections" ON service_sections;
CREATE POLICY "Admin can manage service sections" ON service_sections
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Services (the clickable items inside a section)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES service_sections(id) ON DELETE CASCADE,
  title_el TEXT NOT NULL DEFAULT '',
  title_en TEXT DEFAULT '',
  slug TEXT NOT NULL,
  description_el TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section_id, slug)
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view services" ON services;
CREATE POLICY "Public can view services" ON services
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage services" ON services;
CREATE POLICY "Admin can manage services" ON services
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Images per service (image + description side by side)
CREATE TABLE IF NOT EXISTS service_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption_el TEXT DEFAULT '',
  caption_en TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view service images" ON service_images;
CREATE POLICY "Public can view service images" ON service_images
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage service images" ON service_images;
CREATE POLICY "Admin can manage service images" ON service_images
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Seed sections
INSERT INTO service_sections (name_el, name_en, slug, "order") VALUES
  ('Τεχνικά', 'Technical', 'texnika', 1),
  ('Οικοδομικά', 'Construction', 'oikodomika', 2)
ON CONFLICT (slug) DO NOTHING;

-- 5. Seed technical services
WITH s AS (SELECT id FROM service_sections WHERE slug = 'texnika')
INSERT INTO services (section_id, title_el, title_en, slug, "order")
SELECT s.id, v.el, v.en, v.slug, v.ord
FROM s, (VALUES
  ('Τοπογραφικά', 'Topographic Surveys', 'topografika', 1),
  ('Οριοθέτηση', 'Boundary Demarcation', 'oriothetisi', 2),
  ('Ευρέσεις Οικοπέδων', 'Land Search', 'evreseis-oikopedon', 3),
  ('Τακτοποιήσεις Αυθαιρέτων', 'Legalization of Illegal Buildings', 'taktopoiiseis-afthaireton', 4),
  ('Τεχνικοί Έλεγχοι', 'Technical Inspections', 'technikoi-elegchoi', 5)
) AS v(el, en, slug, ord)
ON CONFLICT (section_id, slug) DO NOTHING;

-- 6. Seed construction services
WITH s AS (SELECT id FROM service_sections WHERE slug = 'oikodomika')
INSERT INTO services (section_id, title_el, title_en, slug, "order")
SELECT s.id, v.el, v.en, v.slug, v.ord
FROM s, (VALUES
  ('Περιφράξεις', 'Fences', 'perifraxeis', 1),
  ('Καθαρισμοί Οικοπέδων', 'Land Clearing', 'katharismoi-oikopedon', 2),
  ('Σιδεροκατασκευές', 'Metal Constructions', 'siderokataskeues', 3),
  ('Πέργκολες', 'Pergolas', 'pergoles', 4),
  ('Γκραζόπορτες', 'Garage Doors', 'grazoportes', 5)
) AS v(el, en, slug, ord)
ON CONFLICT (section_id, slug) DO NOTHING;
