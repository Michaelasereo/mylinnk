/**
 * Test script to verify Cloudflare R2 and Stream credentials
 * This script tests the connection without making actual uploads
 */

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const STREAM_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const STREAM_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function testCloudflare() {
  console.log('🧪 Testing Cloudflare Configuration...\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const missingVars: string[] = [];

  if (!R2_ACCOUNT_ID) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
  if (!R2_ACCESS_KEY_ID) missingVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
  if (!R2_SECRET_ACCESS_KEY) missingVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
  if (!R2_BUCKET_NAME) missingVars.push('CLOUDFLARE_R2_BUCKET_NAME');
  if (!STREAM_API_TOKEN) missingVars.push('CLOUDFLARE_API_TOKEN');

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  console.log(`   Account ID: ${R2_ACCOUNT_ID?.substring(0, 8)}...`);
  console.log(`   R2 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`   R2 Access Key: ${R2_ACCESS_KEY_ID?.substring(0, 8)}...`);
  console.log(`   Stream Token: ${STREAM_API_TOKEN?.substring(0, 8)}...\n`);

  // Test 2: Test R2 connection
  console.log('2️⃣ Testing R2 connection...');
  try {
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });

    // Try to list buckets (this tests the connection)
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('✅ R2 connection successful!');
    console.log(`   Available buckets: ${response.Buckets?.length || 0}`);
    
    // Check if our bucket exists
    const bucketExists = response.Buckets?.some(b => b.Name === R2_BUCKET_NAME);
    if (bucketExists) {
      console.log(`   ✅ Bucket "${R2_BUCKET_NAME}" exists`);
    } else {
      console.log(`   ⚠️  Bucket "${R2_BUCKET_NAME}" not found in bucket list`);
      console.log('   (This might be normal - listing might not show all buckets)');
    }
  } catch (error: any) {
    console.error('❌ R2 connection failed:', error.message);
    if (error.message?.includes('InvalidAccessKeyId')) {
      console.error('   → Check your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
    } else if (error.message?.includes('SignatureDoesNotMatch')) {
      console.error('   → Check your R2_SECRET_ACCESS_KEY');
    }
    process.exit(1);
  }

  // Test 3: Test Stream API
  console.log('\n3️⃣ Testing Stream API connection...');
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${STREAM_ACCOUNT_ID}/stream`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STREAM_API_TOKEN}`,
        },
      }
    );

    if (response.ok) {
      console.log('✅ Stream API connection successful!');
      const data = await response.json();
      console.log(`   API Response: ${data.success ? 'Success' : 'Failed'}`);
    } else {
      const error = await response.json();
      console.error('❌ Stream API connection failed:', error.errors?.[0]?.message || response.statusText);
      if (response.status === 401) {
        console.error('   → Check your CLOUDFLARE_API_TOKEN');
      } else if (response.status === 403) {
        console.error('   → Your API token may not have Stream permissions');
      }
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Stream API connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All Cloudflare tests passed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Sign up / Log in to your app');
  console.log('   3. Navigate to /content/new');
  console.log('   4. Upload a file or video to test the full flow');
  console.log('\n🎉 Your Cloudflare storage is configured correctly!');
}

testCloudflare().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

