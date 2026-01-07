import { NextResponse } from 'next/server';

export async function GET() {
  const requiredEnvVars = [
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET',
    'MUX_ENVIRONMENT_KEY',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'DATABASE_URL'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    missingEnvVars: missing,
    services: {
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      mux: process.env.MUX_TOKEN_ID ? 'configured' : 'missing',
      r2: process.env.CLOUDFLARE_R2_BUCKET_NAME ? 'configured' : 'missing'
    }
  });
}
