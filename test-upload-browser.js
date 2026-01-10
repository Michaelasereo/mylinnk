// Browser Console Test for Supabase Storage
// Copy and paste this into your browser console at http://localhost:3000

(async () => {
  console.log('🎯 TESTING SUPABASE STORAGE UPLOAD');
  console.log('===================================');
  console.log('');

  // 1. Create a test image
  console.log('1️⃣ CREATING TEST IMAGE');
  console.log('----------------------');
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6772E5';
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SUPABASE TEST', 200, 200);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const testImage = new File([blob], 'test-upload.png', { type: 'image/png' });
  console.log(`✅ Test image created: ${testImage.size} bytes`);
  console.log('');

  // 2. Test Profile Upload
  console.log('2️⃣ TESTING PROFILE UPLOAD');
  console.log('-------------------------');
  const formData = new FormData();
  formData.append('file', testImage);
  formData.append('type', 'avatar');

  try {
    const response = await fetch('/api/upload/profile', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, result);

    if (response.ok && result.success) {
      console.log('');
      console.log('✅ UPLOAD SUCCESS!');
      console.log(`📍 URL: ${result.data.url}`);
      console.log(`🔑 Key: ${result.data.key}`);
      console.log(`📏 Size: ${result.data.size} bytes`);
      console.log('');
      console.log('🎉 SUPABASE STORAGE IS WORKING!');
      
      // Display the uploaded image
      const img = document.createElement('img');
      img.src = result.data.url;
      img.style.cssText = 'width: 200px; height: 200px; border-radius: 50%; border: 3px solid #4CAF50; margin: 20px; display: block;';
      document.body.appendChild(img);
      console.log('🖼️ Uploaded image displayed above!');
    } else {
      console.log('');
      console.log('❌ UPLOAD FAILED');
      console.log(`🚨 Error: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.log(`📋 Details: ${result.details}`);
      }
    }
  } catch (error) {
    console.log('');
    console.log('❌ TEST FAILED');
    console.log(`🚨 Error: ${error.message}`);
  }
})();
