import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // #region agent log
  console.error('[DEBUG] Middleware entry:', request.nextUrl.pathname);
  fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:4',message:'Middleware entry',data:{path:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // #region agent log
    console.error('[DEBUG] Env vars check:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:13',message:'Env vars check',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseKey,urlLength:supabaseUrl?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!supabaseUrl || !supabaseKey) {
      // #region agent log
      console.error('[DEBUG] Missing env vars - returning early');
      fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:16',message:'Missing env vars - returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Missing Supabase environment variables');
      return supabaseResponse;
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:20',message:'Creating Supabase client',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:38',message:'Calling auth.getUser',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Refresh session if expired - required for Server Components
    await supabase.auth.getUser();

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:40',message:'Middleware success - returning response',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return supabaseResponse;
  } catch (error) {
    // #region agent log
    console.error('[DEBUG] Middleware error caught:', error);
    fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:42',message:'Middleware error caught',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Middleware error:', error);
    return NextResponse.next({
      request,
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

