// Test Cloudflare upload directly via API
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('🧪 Testing Cloudflare Stream upload...\n');

    // Create a simple test file
    const testFile = Buffer.from('This is a test video file for Cloudflare Stream upload');
    const testFileName = 'test-video.mp4';

    // Create FormData-like object
    const formData = new FormData();
    const file = new Blob([testFile], { type: 'video/mp4' });
    formData.append('file', file);

    console.log('📤 Uploading to Cloudflare Stream...');

    const response = await fetch('http://localhost:3000/api/upload/stream', {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Upload failed:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Upload successful!');
    console.log('📊 Response data:', JSON.stringify(data, null, 2));

    if (data.videoId) {
      console.log('🎬 Video ID:', data.videoId);
      console.log('🖼️  Thumbnail:', data.thumbnail);
      console.log('🎥 Playback URLs:', data.playback);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpload();
