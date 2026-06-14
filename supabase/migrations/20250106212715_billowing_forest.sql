/*
  # Make receipts bucket public

  1. Changes
    - Update receipts bucket to be public
    - Add policy for public read access
*/

-- Update the receipts bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'receipts';

-- Add policy for public read access to files
CREATE POLICY "Allow public read access to receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');