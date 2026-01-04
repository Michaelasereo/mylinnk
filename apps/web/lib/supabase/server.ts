import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // #region agent log
  console.error('[DEBUG] createClient called');
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.error('[DEBUG] Env vars in createClient:', { hasUrl, hasKey });
  fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:5',message:'createClient called',data:{hasUrl,hasKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const cookieStore = await cookies();
    // #region agent log
    console.error('[DEBUG] Cookies retrieved');
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:8',message:'Cookies retrieved',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  } catch (error) {
    // #region agent log
    console.error('[DEBUG] createClient error:', error);
    // #endregion
    throw error;
  }
}

