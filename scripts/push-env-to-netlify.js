#!/usr/bin/env node

/**
 * Script to push environment variables from .env.local to Netlify
 * Usage: node scripts/push-env-to-netlify.js [site-id]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '../apps/web/.env.local');
const SITE_ID = process.argv[2];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const envVars = {};

  content.split('\n').forEach((line) => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      return;
    }

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

function setNetlifyEnv(key, value, context = 'all') {
  const contexts = context === 'all' 
    ? ['production', 'deploy-preview', 'branch-deploy']
    : [context];

  contexts.forEach((ctx) => {
    try {
      const command = `npx netlify-cli env:set "${key}" "${value}" --context ${ctx} 2>&1 | grep -v "Warning:" || true`;
      execSync(command, { stdio: 'inherit', shell: '/bin/bash' });
    } catch (error) {
      console.error(`Failed to set ${key} for ${ctx}:`, error.message);
    }
  });
}

async function main() {
  console.log('📦 Reading environment variables from:', ENV_FILE);
  const envVars = readEnvFile(ENV_FILE);
  
  console.log(`\n🔑 Found ${Object.keys(envVars).length} environment variables\n`);

  if (SITE_ID) {
    console.log(`Using site ID: ${SITE_ID}`);
    process.env.NETLIFY_SITE_ID = SITE_ID;
  }

  console.log('Setting environment variables in Netlify...\n');

  let count = 0;
  for (const [key, value] of Object.entries(envVars)) {
    // Skip placeholder values
    if (value.includes('your-') || value === 'your_webhook_secret' || value === 'your-account-id') {
      console.log(`⏭️  Skipping ${key} (placeholder value)`);
      continue;
    }

    console.log(`Setting ${key}...`);
    setNetlifyEnv(key, value);
    count++;
  }

  console.log(`\n✅ Successfully set ${count} environment variables!`);
  console.log('\nTo verify, run:');
  console.log('  npx netlify-cli env:list');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

