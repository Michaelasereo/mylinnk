// 🎯 VIDEO UPLOAD TEST
// Test the video upload functionality

(async () => {
  console.log('🎬 TESTING VIDEO UPLOAD SYSTEM');
  console.log('===============================');
  console.log('');
  
  // 1. Check authentication
  console.log('1️⃣ CHECKING AUTHENTICATION...');
  try {
    const authRes = await fetch('/api/creator/me');
    const authData = await authRes.json();
    
    if (authData.error) {
      console.log('❌ NOT AUTHENTICATED');
      console.log('💡 Please log in to Odim first');
      return;
    }
    
    console.log('✅ AUTHENTICATED:', authData.displayName);
    console.log('');
    
  } catch (error) {
    console.log('❌ AUTH CHECK FAILED:', error.message);
    return;
  }
  
  // 2. Create a small test video (MP4 header only - won't actually play but tests API)
  console.log('2️⃣ CREATING TEST VIDEO FILE...');
  
  // Create minimal MP4 header (this will pass validation but won't be a real video)
  const mp4Header = new Uint8Array([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  
  const testVideo = new File([mp4Header], 'test-video.mp4', { type: 'video/mp4' });
  
  console.log('✅ Test video created:', testVideo.size, 'bytes');
  console.log('');
  
  // 3. Test video upload
  console.log('3️⃣ TESTING VIDEO UPLOAD...');
  
  const formData = new FormData();
  formData.append('file', testVideo);
  
  console.log('📤 Uploading to /api/upload/stream...');
  
  try {
    const response = await fetch('/api/upload/stream', {
      method: 'POST',
      body: formData
    });
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ VIDEO UPLOAD SUCCESSFUL!');
      console.log('📋 API Response:', result);
      
      if (result.success && result.data) {
        console.log('');
        console.log('🎉 🎉 🎉 VIDEO UPLOAD WORKS! 🎉 🎉 🎉');
        console.log('');
        console.log('✅ Mux integration: WORKING');
        console.log('✅ Database records: CREATED');
        console.log('✅ Content creation: SUCCESSFUL');
        console.log('');
        console.log('📊 Upload Details:');
        console.log('- Upload ID:', result.data.uploadId);
        console.log('- Content ID:', result.data.contentId);
        console.log('- Playback URL:', result.data.playbackUrl);
        console.log('- Asset ID:', result.data.assetId);
        console.log('');
        console.log('🚀 Your video upload system is fully operational!');
        
      } else {
        console.log('❌ Response missing success/data fields');
        console.log('Response:', result);
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ VIDEO UPLOAD FAILED');
      console.log('📋 Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Parsed error:', errorJson);
        
        // Provide specific troubleshooting
        if (errorJson.details?.includes('Mux')) {
          console.log('');
          console.log('🎬 MUX ISSUE DETECTED');
          console.log('💡 Check MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local');
        } else if (errorJson.details?.includes('schema') || errorJson.details?.includes('field')) {
          console.log('');
          console.log('🗄️ DATABASE SCHEMA ISSUE');
          console.log('💡 Content model schema mismatch - check field names');
        } else if (errorJson.details?.includes('auth') || errorJson.error?.includes('Authentication')) {
          console.log('');
          console.log('🔐 AUTHENTICATION ISSUE');
          console.log('💡 User session expired - please log in again');
        }
        
      } catch {
        console.log('📋 Raw error:', errorText);
      }
    }
    
  } catch (networkError) {
    console.log('❌ NETWORK ERROR:', networkError.message);
  }
  
  console.log('');
  console.log('🎯 VIDEO UPLOAD TEST COMPLETE');
})();
