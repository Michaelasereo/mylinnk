/**
 * Environment validation with fail-fast approach
 * Ensures all required environment variables are present before startup
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    'PAYSTACK_SECRET_KEY',
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL'
  ];

  const recommended = [
    'REDIS_URL',
    'SENTRY_DSN',
    'NODE_ENV'
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check recommended variables
  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`${key} not set (recommended for production)`);
    }
  }

  // Additional validation for specific services
  if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('redis://')) {
    warnings.push('REDIS_URL should start with redis://');
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('http')) {
    warnings.push('NEXT_PUBLIC_APP_URL should include protocol (http/https)');
  }

  const valid = missing.length === 0;

  return { valid, missing, warnings };
}

export function validateAndExit(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    result.missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Please set these variables in your .env.local file');
    process.exit(1); // Fail fast
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  ENVIRONMENT WARNINGS:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  console.log('✅ Environment validation passed');
}
