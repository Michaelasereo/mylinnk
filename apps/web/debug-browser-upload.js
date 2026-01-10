// 🎯 BROWSER UPLOAD ERROR DEBUGGER
// Copy this to browser console to intercept and debug upload errors

// Override the fetch function to log all requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [url, options] = args;
  
  // Only log upload-related requests
  if (url.includes('/api/upload/') || url.includes('/api/content')) {
    console.log('🚀 INTERCEPTED REQUEST:', {
      url: url,
      method: options?.method || 'GET',
      headers: options?.headers,
      hasBody: !!options?.body,
      bodyType: options?.body instanceof FormData ? 'FormData' : 
               options?.body instanceof Object ? 'JSON' : 'Other'
    });
    
    // Log FormData contents if it's an upload
    if (options?.body instanceof FormData) {
      console.log('📋 FormData contents:');
      for (let [key, value] of options.body.entries()) {
        console.log(`   ${key}:`, value instanceof File ? 
          `File(${value.name}, ${value.type}, ${value.size} bytes)` : value);
      }
    }
    
    // Log JSON body if it's content creation
    if (options?.body && typeof options.body === 'string' && 
        options.headers?.['Content-Type']?.includes('json')) {
      try {
        const jsonBody = JSON.parse(options.body);
        console.log('📋 JSON Body:', jsonBody);
      } catch (e) {
        console.log('📋 Body (not JSON):', options.body);
      }
    }
  }
  
  try {
    const response = await originalFetch.apply(this, args);
    
    // Only log upload-related responses
    if (url.includes('/api/upload/') || url.includes('/api/content')) {
      console.log('📊 INTERCEPTED RESPONSE:', {
        url: url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Clone response to read body without consuming it
      const clonedResponse = response.clone();
      try {
        const responseText = await clonedResponse.text();
        console.log('📋 Response Body:', responseText);
        
        try {
          const responseJson = JSON.parse(responseText);
          console.log('📋 Parsed Response:', responseJson);
          
          // Check for errors
          if (!response.ok || responseJson.error || !responseJson.success) {
            console.log('🚨 ERROR DETECTED!');
            console.log('   Status:', response.status);
            console.log('   Error:', responseJson.error || 'Unknown error');
            console.log('   Success:', responseJson.success);
            
            // Provide specific troubleshooting
            if (responseJson.error?.includes('policy') || responseJson.error?.includes('RLS')) {
              console.log('🔧 SOLUTION: Supabase RLS policy issue');
              console.log('   Check: https://supabase.com/dashboard → Storage → crealio → Policies');
            } else if (responseJson.error?.includes('mux') || responseJson.error?.includes('Mux')) {
              console.log('🔧 SOLUTION: Mux API credentials issue');
              console.log('   Check: MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local');
            } else if (responseJson.error?.includes('auth') || responseJson.error?.includes('Authentication')) {
              console.log('🔧 SOLUTION: User not authenticated');
              console.log('   Try: Log out and log back in');
            } else if (response.status === 500) {
              console.log('🔧 SOLUTION: Server error - check server console logs');
            }
          }
        } catch (jsonError) {
          console.log('📋 Response not JSON:', responseText);
        }
      } catch (bodyError) {
        console.log('❌ Could not read response body:', bodyError.message);
      }
    }
    
    return response;
  } catch (error) {
    console.error('❌ FETCH ERROR:', error);
    throw error;
  }
};

console.log('🎯 UPLOAD DEBUGGER ACTIVATED');
console.log('============================');
console.log('✅ All /api/upload/* and /api/content requests will be logged');
console.log('✅ Response details and errors will be analyzed');
console.log('✅ Specific troubleshooting suggestions provided');
console.log('');
console.log('🚀 Now try uploading a video in the UI to see detailed error logs!');
