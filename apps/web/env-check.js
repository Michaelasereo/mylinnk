
// 🎯 ENVIRONMENT VARIABLES CHECK
// Copy this to browser console at http://localhost:3000

(() => {
  console.log('🔍 ENVIRONMENT VARIABLES CHECK');
  console.log('==============================');
  
  const supabaseUrl = window.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = window.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
  console.log('Key:', supabaseKey ? '✅ SET (length: ' + supabaseKey.length + ')' : '❌ MISSING');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('');
    console.log('❌ MISSING ENVIRONMENT VARIABLES');
    console.log('💡 Make sure these are in your .env.local:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]');
    return;
  }
  
  console.log('');
  console.log('✅ Environment variables configured');
  console.log('');
  console.log('🎯 NEXT: Run the debug upload test above');
})();

