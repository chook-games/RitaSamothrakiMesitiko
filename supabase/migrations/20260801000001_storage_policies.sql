-- Storage bucket policies for office (logo) and listings (images)
-- Run this in the Supabase SQL Editor (or apply via migration)

-- Allow authenticated users to upload objects in 'office' bucket
CREATE POLICY "Admin can upload office objects"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'office' AND auth.role() = 'authenticated');

-- Allow authenticated users to update objects in 'office' bucket
CREATE POLICY "Admin can update office objects"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'office' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete objects in 'office' bucket
CREATE POLICY "Admin can delete office objects"
ON storage.objects
FOR DELETE
USING (bucket_id = 'office' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload objects in 'listings' bucket
CREATE POLICY "Admin can upload listing objects"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

-- Allow authenticated users to update objects in 'listings' bucket
CREATE POLICY "Admin can update listing objects"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'listings' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete objects in 'listings' bucket
CREATE POLICY "Admin can delete listing objects"
ON storage.objects
FOR DELETE
USING (bucket_id = 'listings' AND auth.role() = 'authenticated');

-- Ensure public can read both buckets
CREATE POLICY "Public can read office objects"
ON storage.objects
FOR SELECT
USING (bucket_id = 'office');

CREATE POLICY "Public can read listing objects"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listings');
