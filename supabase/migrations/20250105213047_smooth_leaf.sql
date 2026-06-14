/*
  # Create storage bucket for receipts

  1. New Storage
    - Create 'receipts' bucket for storing receipt files
  2. Security
    - Enable public access for authenticated users
    - Set up storage policies for user access
*/

-- Create a new storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Policy to allow users to read their own receipts
CREATE POLICY "Allow users to read own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);