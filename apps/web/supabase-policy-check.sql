
// 🎯 SUPABASE BUCKET POLICY CHECK
// Run this in Supabase SQL Editor to verify policies

// Check if policies exist
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage';

// Expected policies:
// 1. Public Access (SELECT, permissive)
// 2. Users can upload (INSERT, authenticated role)

// If policies are missing, run:

-- Enable public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'crealio');

-- Enable authenticated users to upload
CREATE POLICY "Users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'crealio');

-- Optional: Allow users to update/delete their own files
CREATE POLICY "Users can update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'crealio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'crealio' AND auth.uid()::text = (storage.foldername(name))[1]);

