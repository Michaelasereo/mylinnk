
// 🎯 SUPABASE RLS POLICY FIX
// Run these SQL commands in Supabase Dashboard → SQL Editor

// STEP 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

// STEP 2: Create the required policies (run each one)

// Policy 1: Public can view uploaded files
CREATE POLICY "Public can view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crealio');

// Policy 2: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'crealio' AND
  (storage.foldername(name))[1] IN ('avatars', 'banners') AND
  auth.uid()::text = (storage.foldername(name))[2]
);

// Policy 3: Users can update their own files
CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'crealio' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

// Policy 4: Users can delete their own files
CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'crealio' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

// STEP 3: Verify bucket exists and is public
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'crealio';

// If bucket doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public)
VALUES ('crealio', 'crealio', true)
ON CONFLICT (id) DO NOTHING;

// STEP 4: ALTERNATIVE - Disable RLS for development (if policies don't work)
-- WARNING: Only for development! Remove in production
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

