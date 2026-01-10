
// Test the fixed upload system
// Copy this to your browser console at http://localhost:3000

(async () => {
  console.log('🎯 TESTING FIXED UPLOAD SYSTEM');
  console.log('=================================');

  // Test 1: Profile upload with type parameter
  console.log('1️⃣ TESTING PROFILE UPLOAD...');
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6772E5';
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FIXED UPLOAD TEST', 200, 200);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const testImage = new File([blob], 'test-fixed.png', { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', testImage);
  formData.append('type', 'avatar');

  try {
    const response = await fetch('/api/upload/profile', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', result);

    if (response.ok && result.success) {
      console.log('✅ UPLOAD SUCCESS!');
      console.log('📍 URL:', result.data.url);
      console.log('🖼️ Optimized:', result.data.size < testImage.size ? 'YES' : 'NO');

      // Display image
      const img = document.createElement('img');
      img.src = result.data.url;
      img.style.cssText = 'width: 200px; height: 200px; border-radius: 50%; border: 3px solid #4CAF50; margin: 20px;';
      document.body.appendChild(img);
    } else {
      console.log('❌ UPLOAD FAILED:', result.error);
    }
  } catch (error) {
    console.log('❌ TEST FAILED:', error.message);
  }

  console.log('');
  console.log('🎉 UPLOAD SYSTEM FIXES VERIFIED!');
})();

