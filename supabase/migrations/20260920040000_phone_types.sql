-- Rita Samothraki - Phone types (mobile / landline)
-- Run this in your Supabase SQL Editor

-- Convert phones from ["210...", ...] to [{ "number": "210...", "type": "landline" }, ...]
UPDATE office_settings
SET phones = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('number', value, 'type', 'landline')), '[]'::jsonb)
  FROM jsonb_array_elements_text(phones) AS value
)
WHERE jsonb_typeof(phones) = 'array'
  AND jsonb_array_length(phones) > 0
  AND jsonb_typeof(phones->0) = 'string';
