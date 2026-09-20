-- Rita Samothraki - Multiple phone numbers
-- Run this in your Supabase SQL Editor

ALTER TABLE office_settings ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;

-- Backfill from the existing single phone
UPDATE office_settings
SET phones = jsonb_build_array(phone)
WHERE (phones IS NULL OR phones = '[]'::jsonb)
  AND phone IS NOT NULL
  AND phone <> '';
