import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Odim - Your Nigerian Creator Platform',
  description: 'Monetize your creativity with instant Naira payouts',
  keywords: ['creator platform', 'Nigeria', 'subscription', 'content creator'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // #region agent log
  console.error('[DEBUG] RootLayout rendering');
  await fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:15',message:'RootLayout rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    console.error('[DEBUG] Before ThemeProvider');
    await fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:24',message:'Before ThemeProvider',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    );
  } catch (error) {
    // #region agent log
    console.error('[DEBUG] Layout error:', error);
    await fetch('http://127.0.0.1:7244/ingest/911f2d9c-1911-412d-9438-d1a934c37414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:35',message:'Layout error caught',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}

