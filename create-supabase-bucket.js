// Create Supabase Storage Bucket
// Run with: node create-supabase-bucket.js

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function createSupabaseBucket() {
  console.log('🗄️ CREATING SUPABASE STORAGE BUCKET');
  console.log('===================================');
  console.log('');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('1️⃣ CHECKING CREDENTIALS');
  console.log('=======================');
  console.log(`URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`);
  console.log(`Anon Key: ${supabaseKey ? '✅ SET' : '❌ MISSING'}`);
  console.log(`Service Key: ${serviceKey ? '✅ SET' : '❌ MISSING'}`);

  if (!supabaseUrl || !supabaseKey || !serviceKey) {
    console.log('❌ Missing Supabase credentials');
    console.log('💡 Check your .env.local file');
    return;
  }

  console.log('');
  console.log('2️⃣ CREATING BUCKET');
  console.log('==================');

  try {
    // Use service key for admin operations
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('🔗 Connecting with service key...');

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.log('❌ Failed to list buckets:', listError.message);
      return;
    }

    const bucketExists = existingBuckets.some(b => b.name === 'crealio');

    if (bucketExists) {
      console.log('✅ crealio bucket already exists!');
      console.log('🎯 Proceeding to configure policies...');
    } else {
      console.log('📦 Creating crealio bucket...');

      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('crealio', {
        public: true, // Make bucket public for image access
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 52428800, // 50MB limit
      });

      if (createError) {
        console.log('❌ Failed to create bucket:', createError.message);
        return;
      }

      console.log('✅ crealio bucket created successfully!');
    }

    console.log('');
    console.log('3️⃣ CONFIGURING POLICIES');
    console.log('=======================');

    // Note: Supabase doesn't have a direct API for creating storage policies
    // Policies need to be created in the dashboard or via SQL
    console.log('ℹ️ Storage policies cannot be created via API');
    console.log('📋 Please add these policies in Supabase Dashboard:');
    console.log('');
    console.log('POLICY 1 - Allow authenticated uploads:');
    console.log('```sql');
    console.log('bucket_id = \'crealio\'');
    console.log('AND auth.role() = \'authenticated\'');
    console.log('```');
    console.log('');
    console.log('POLICY 2 - Allow public image access:');
    console.log('```sql');
    console.log('bucket_id = \'crealio\'');
    console.log('AND (storage.foldername(name))[1] = \'avatars\'');
    console.log('OR (storage.foldername(name))[1] = \'banners\'');
    console.log('OR (storage.foldername(name))[1] = \'images\'');
    console.log('```');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard → Storage → crealio → Policies');
    console.log('');

    // Verify bucket was created
    const { data: verifyBuckets, error: verifyError } = await supabase.storage.listBuckets();

    if (verifyError) {
      console.log('❌ Failed to verify bucket creation');
      return;
    }

    const crealioBucket = verifyBuckets.find(b => b.name === 'crealio');

    if (crealioBucket) {
      console.log('4️⃣ VERIFICATION COMPLETE');
      console.log('=======================');
      console.log('✅ crealio bucket: CREATED');
      console.log('✅ Bucket is public:', crealioBucket.public ? 'YES' : 'NO');
      console.log('📅 Created:', crealioBucket.created_at);
      console.log('');
      console.log('🎉 SUPABASE BUCKET CREATED SUCCESSFULLY!');
      console.log('');
      console.log('📋 NEXT STEPS:');
      console.log('1. Add the storage policies in Supabase Dashboard');
      console.log('2. Run: node test-supabase-storage.js');
      console.log('3. Your storage should be fully operational!');
    } else {
      console.log('❌ Bucket creation verification failed');
    }

  } catch (error) {
    console.log('❌ Bucket creation failed:', error.message);
    console.log('');
    console.log('🔍 POSSIBLE ISSUES:');
    console.log('• Invalid Supabase credentials');
    console.log('• Service key doesn\'t have bucket creation permissions');
    console.log('• Bucket name already taken');
    console.log('• Network connectivity issues');
  }
}

// Run the bucket creation
createSupabaseBucket().catch(console.error);
