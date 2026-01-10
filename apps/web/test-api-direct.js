
// Test the video upload API directly to see server error
const fetch = require('node-fetch');
const fs = require('fs');

async function testVideoUploadDirect() {
  console.log('🔍 TESTING VIDEO UPLOAD API DIRECTLY');
  console.log('=====================================');
  
  // Create a minimal test video
  const mp4Data = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  
  const testFile = '/tmp/test-video.mp4';
  fs.writeFileSync(testFile, mp4Data);
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(testFile), {
    filename: 'test-video.mp4',
    contentType: 'video/mp4'
  });
  
  try {
    console.log('📤 Sending request to /api/upload/stream...');
    
    const response = await fetch('http://localhost:3000/api/upload/stream', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log('📊 Status:', response.status);
    
    const responseText = await response.text();
    console.log('📋 Response:', responseText);
    
    if (response.status === 401) {
      console.log('❌ 401 Unauthorized - API requires authentication');
      console.log('💡 This is expected - API needs logged-in user');
    } else if (response.status === 500) {
      console.log('❌ 500 Internal Server Error - Server-side issue');
      console.log('💡 Check server console for detailed error logs');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  // Cleanup
  try {
    fs.unlinkSync(testFile);
  } catch {}
}

testVideoUploadDirect();

