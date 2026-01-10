
// 🎯 ENVIRONMENT VARIABLES CHECK FOR VIDEO UPLOAD
// Run this in your browser console to check what you need

(() => {
  console.log('🔍 MISSING ENVIRONMENT VARIABLES CHECK');
  console.log('======================================');
  
  const missing = [];
  
  // Required for video uploads
  if (!window.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!window.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  // Mux (for videos) - these are likely missing
  if (!window.MUX_TOKEN_ID) missing.push('MUX_TOKEN_ID');
  if (!window.MUX_TOKEN_SECRET) missing.push('MUX_TOKEN_SECRET');
  
  if (missing.length === 0) {
    console.log('✅ All required environment variables are set!');
  } else {
    console.log('❌ MISSING ENVIRONMENT VARIABLES:');
    missing.forEach(key => console.log());
    console.log('');
    console.log('💡 Add these to your .env.local file:');
    console.log('');
    console.log('// Supabase (already set)');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co');
    console.log('SUPABASE_SERVICE_ROLE_KEY=[service-role-key]');
    console.log('');
    console.log('// Mux Video API (get from https://dashboard.mux.com)');
    console.log('MUX_TOKEN_ID=[your-mux-token-id]');
    console.log('MUX_TOKEN_SECRET=[your-mux-token-secret]');
  }
})();

