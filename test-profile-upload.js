// Test Profile Image Upload
// Run this in browser console on settings page

(async () => {
  console.log('🖼️ Testing Profile Image Upload...');

  try {
    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'test-profile.png');
      formData.append('fileName', 'test-profile.png');

      console.log('📤 Uploading test image...');

      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Profile upload SUCCESS!');
        console.log('📍 URL:', result.url);
        console.log('📁 File:', result.fileName);
      } else {
        console.log('❌ Profile upload FAILED:', result.error);
      }
    }, 'image/png');

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
})();
