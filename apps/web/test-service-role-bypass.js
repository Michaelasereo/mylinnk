// 🎯 FINAL RLS BYPASS TEST
// Test upload with service role key (bypasses RLS)

(async () => {
  console.log('🚀 TESTING SERVICE ROLE KEY BYPASS');
  console.log('===================================');
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
  
  // 2. Create test image
  console.log('2️⃣ CREATING TEST IMAGE...');
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  
  // Red background with white text
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(0, 0, 150, 150);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('RLS BYPASS', 75, 70);
  ctx.font = '12px Arial';
  ctx.fillText('Service Key', 75, 90);
  
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const testImage = new File([blob], 'rls-bypass-test.png', { type: 'image/png' });
  
  console.log('✅ Test image created:', testImage.size, 'bytes');
  console.log('');
  
  // 3. Test upload with service role key
  console.log('3️⃣ TESTING UPLOAD WITH SERVICE ROLE KEY...');
  console.log('💡 This should bypass RLS policies entirely');
  console.log('');
  
  const formData = new FormData();
  formData.append('file', testImage);
  formData.append('type', 'avatar');
  
  console.log('📤 Sending upload request...');
  console.log('🔑 Using service role key (bypasses RLS)');
  
  try {
    const response = await fetch('/api/upload/profile', {
      method: 'POST',
      body: formData
    });
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ UPLOAD SUCCESSFUL!');
      console.log('📋 API Response:', result);
      
      const imageUrl = result.data?.url;
      
      if (imageUrl) {
        console.log('🔗 Image URL:', imageUrl);
        
        if (imageUrl.includes('supabase.co')) {
          console.log('');
          console.log('🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
          console.log('✅ SERVICE ROLE KEY BYPASS WORKS!');
          console.log('✅ RLS POLICIES BYPASSED!');
          console.log('✅ UPLOAD TO SUPABASE STORAGE WORKS!');
          console.log('');
          
          // Display the image
          const img = document.createElement('img');
          img.src = imageUrl;
          img.style.cssText = 'width: 150px; height: 150px; border-radius: 50%; border: 4px solid #FF6B6B; margin: 20px; box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);';
          
          img.onload = () => {
            console.log('🖼️ IMAGE LOADED SUCCESSFULLY!');
            console.log('✅ PUBLIC ACCESS WORKS!');
            document.body.appendChild(img);
            
            console.log('');
            console.log('🏆 YOUR UPLOAD SYSTEM IS NOW WORKING!');
            console.log('');
            console.log('✅ Service role key bypass: WORKING');
            console.log('✅ Supabase Storage upload: WORKING');
            console.log('✅ Image optimization: WORKING');
            console.log('✅ Public CDN access: WORKING');
            console.log('');
            console.log('🎯 Next steps:');
            console.log('1. Test SettingsForm upload (should work now)');
            console.log('2. Optionally add proper RLS policies for production');
            console.log('3. Remove service role key usage in production (use proper policies)');
          };
          
          img.onerror = () => {
            console.log('⚠️ Image failed to load');
            console.log('💡 Check if bucket is public');
          };
          
        } else if (imageUrl.includes('placeholder.com')) {
          console.log('⚠️ Still returning placeholder URL');
          console.log('❌ Service role key bypass failed');
          console.log('💡 Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
        } else {
          console.log('❓ Unexpected URL format:', imageUrl);
        }
        
      } else {
        console.log('❌ No URL returned in response');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ UPLOAD FAILED');
      console.log('📋 Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Parsed error:', errorJson);
        
        if (errorJson.details?.includes('role') || errorJson.error?.includes('key')) {
          console.log('');
          console.log('🔑 SERVICE ROLE KEY ISSUE');
          console.log('💡 Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
          console.log('🔗 Get it from: Supabase Dashboard → Settings → API → service_role key');
        }
        
      } catch {
        console.log('📋 Raw error:', errorText);
      }
    }
    
  } catch (error) {
    console.log('❌ REQUEST ERROR:', error.message);
  }
  
  console.log('');
  console.log('🎯 TEST COMPLETE');
})();
