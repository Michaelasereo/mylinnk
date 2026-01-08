// 🖼️ COMPREHENSIVE PROFILE & BANNER UPLOAD TEST
// Run this in your browser console on the Settings page

(async () => {
  console.log('🎯 ODIM PROFILE & BANNER UPLOAD TEST');
  console.log('=====================================');
  console.log('');

  const results = {
    profileTest: null,
    bannerTest: null,
    overall: 'pending'
  };

  // Function to create a test image
  function createTestImage(color = '#FF6B6B', width = 200, height = 200) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add some text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', width/2, height/2 - 10);
      ctx.font = '14px Arial';
      ctx.fillText('IMAGE', width/2, height/2 + 15);

      canvas.toBlob(resolve, 'image/png');
    });
  }

  // Function to test upload
  async function testUpload(imageBlob, fileName, testName) {
    console.log(`📤 Testing ${testName}...`);

    try {
      const formData = new FormData();
      formData.append('file', imageBlob, fileName);

      const startTime = Date.now();
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });
      const duration = Date.now() - startTime;

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ ${testName} SUCCESS (${duration}ms)`);
        console.log(`   📍 URL: ${result.url}`);
        console.log(`   📁 File: ${result.fileName}`);
        console.log('');
        return { success: true, url: result.url, fileName: result.fileName };
      } else {
        console.log(`❌ ${testName} FAILED (${duration}ms)`);
        console.log(`   🚨 Error: ${result.error}`);
        console.log('');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log(`❌ ${testName} ERROR`);
      console.log(`   🚨 Exception: ${error.message}`);
      console.log('');
      return { success: false, error: error.message };
    }
  }

  // Test 1: Profile Image Upload
  console.log('1️⃣ TESTING PROFILE IMAGE UPLOAD');
  console.log('-------------------------------');
  const profileImage = await createTestImage('#FF6B6B', 200, 200);
  results.profileTest = await testUpload(profileImage, 'test-profile.png', 'Profile Image');

  // Test 2: Banner Image Upload
  console.log('2️⃣ TESTING BANNER IMAGE UPLOAD');
  console.log('------------------------------');
  const bannerImage = await createTestImage('#4ECDC4', 1200, 400);
  results.bannerTest = await testUpload(bannerImage, 'test-banner.png', 'Banner Image');

  // Overall Results
  console.log('🎯 FINAL TEST RESULTS');
  console.log('===================');
  console.log('');

  const profileSuccess = results.profileTest?.success;
  const bannerSuccess = results.bannerTest?.success;

  if (profileSuccess && bannerSuccess) {
    results.overall = 'SUCCESS';
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Profile image upload: WORKING');
    console.log('✅ Banner image upload: WORKING');
    console.log('');
    console.log('🚀 Your profile & banner uploads are fully functional!');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   • Go to Settings page');
    console.log('   • Click profile avatar to upload');
    console.log('   • Click banner area to upload');
    console.log('   • Save changes to persist images');
  } else if (profileSuccess || bannerSuccess) {
    results.overall = 'PARTIAL';
    console.log('⚠️ PARTIAL SUCCESS');
    console.log('');
    if (profileSuccess) console.log('✅ Profile image upload: WORKING');
    else console.log('❌ Profile image upload: FAILED');

    if (bannerSuccess) console.log('✅ Banner image upload: WORKING');
    else console.log('❌ Banner image upload: FAILED');
  } else {
    results.overall = 'FAILED';
    console.log('❌ ALL TESTS FAILED');
    console.log('');
    console.log('🚨 Upload functionality needs debugging');
  }

  console.log('');
  console.log('📊 Test Summary:');
  console.log(`   Profile Upload: ${results.profileTest?.success ? '✅' : '❌'}`);
  console.log(`   Banner Upload:  ${results.bannerTest?.success ? '✅' : '❌'}`);
  console.log(`   Overall Status: ${results.overall}`);

  return results;
})();
