-- Rita Samothraki - Per-image titles + primary image
-- Run this in your Supabase SQL Editor

ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS title_el TEXT DEFAULT '';
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT '';
ALTER TABLE listing_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Mark the first image (by order) of each listing as primary, if none is set yet
UPDATE listing_images li
SET is_primary = true
WHERE li.id IN (
  SELECT DISTINCT ON (listing_id) id
  FROM listing_images
  ORDER BY listing_id, "order" ASC, created_at ASC
)
AND NOT EXISTS (
  SELECT 1 FROM listing_images x WHERE x.listing_id = li.listing_id AND x.is_primary = true
);
