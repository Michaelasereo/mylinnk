
// 🎯 SUPABASE UPLOAD DEBUG TEST
// Copy this to your browser console at http://localhost:3000

(async () => {
  console.log('🔍 SUPABASE UPLOAD DEBUG TEST');
  console.log('===============================');
  
  // Step 1: Test Supabase client
  console.log('1️⃣ TESTING SUPABASE CLIENT...');
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.47.10');
    const supabase = createClient(
      window.NEXT_PUBLIC_SUPABASE_URL,
      window.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client created');
    
    // Test bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    console.log('📦 Buckets:', buckets);
    
    if (bucketError) {
      console.log('❌ Bucket list error:', bucketError.message);
    } else {
      const crealioBucket = buckets.find(b => b.name === 'crealio');
      console.log('📦 crealio bucket found:', !!crealioBucket);
      
      if (crealioBucket) {
        console.log('✅ Bucket exists, public:', crealioBucket.public);
      }
    }
    
  } catch (error) {
    console.log('❌ Supabase client error:', error.message);
  }
  
  console.log('');
  
  // Step 2: Test upload API
  console.log('2️⃣ TESTING UPLOAD API...');
  
  // Create test image
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TEST', 50, 55);
  
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const testImage = new File([blob], 'debug-test.png', { type: 'image/png' });
  
  console.log('📸 Created test image:', testImage.size, 'bytes');
  
  // Test upload
  const formData = new FormData();
  formData.append('file', testImage);
  formData.append('type', 'avatar');
  
  try {
    console.log('📤 Uploading...');
    const response = await fetch('/api/upload/profile', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📋 Response:', result);
      
      const url = result.data?.url;
      
      if (url) {
        console.log('🔗 URL received:', url);
        
        // Check if it's a Supabase URL
        if (url.includes('supabase.co')) {
          console.log('✅ REAL SUPABASE URL DETECTED!');
          
          // Try to load the image
          const img = document.createElement('img');
          img.src = url;
          img.onload = () => {
            console.log('🖼️ Image loaded successfully!');
            img.style.cssText = 'width: 100px; height: 100px; border: 2px solid #4CAF50; margin: 10px;';
            document.body.appendChild(img);
          };
          img.onerror = () => {
            console.log('❌ Image failed to load - check Supabase policies');
          };
          
        } else if (url.includes('placeholder.com')) {
          console.log('⚠️ PLACEHOLDER URL - Supabase upload failed');
          console.log('💡 Check Supabase bucket policies and credentials');
        } else {
          console.log('❓ Unknown URL format:', url);
        }
      } else {
        console.log('❌ No URL in response');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Upload failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
  }
  
  console.log('');
  console.log('🎯 DEBUG COMPLETE');
})();

