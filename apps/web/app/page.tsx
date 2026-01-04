import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  // #region agent log
  console.error('[DEBUG] HomePage rendering');
  fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:5',message:'HomePage rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Odim Platform</h1>
        <p className="text-xl mb-8">Your Nigerian Creator Platform</p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

