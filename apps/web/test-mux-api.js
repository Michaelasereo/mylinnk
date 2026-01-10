
// Test Mux API credentials directly
const https = require('https');

function testMuxCredentials() {
  return new Promise((resolve) => {
    const auth = Buffer.from(`53a3aa7e-b5df-435e-9c2d-648fba0ac091:lspa398gqX6VCK0tDy1nl995nZlqgCHX4yiyDPZAj2u2mQ5hNm6rwW5yhTt1txkvw33GjEJXbvT`).toString('base64');
    
    const options = {
      hostname: 'api.mux.com',
      port: 443,
      path: '/video/v1/uploads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('📊 Mux API Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ Mux API credentials are VALID');
          console.log('📋 Response preview:', data.substring(0, 100) + '...');
        } else {
          console.log('❌ Mux API credentials INVALID or ERROR');
          console.log('📋 Response:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Mux API connection failed:', error.message);
      resolve();
    });
    
    // Send minimal JSON body
    req.write(JSON.stringify({
      cors_origin: 'http://localhost:3000',
      new_asset_settings: {
        playback_policy: ['public']
      }
    }));
    
    req.end();
  });
}

console.log('🔍 TESTING MUX API CREDENTIALS');
console.log('===============================');
testMuxCredentials().then(() => {
  console.log('🎯 MUX CREDENTIAL TEST COMPLETE');
});

