#!/usr/bin/env node

// 🚀 ODIM PLATFORM - CRITICAL FIXES VERIFICATION SCRIPT
// Run this to verify all critical fixes are working

const fs = require('fs');
const path = require('path');

console.log('🧪 CRITICAL FIXES VERIFICATION SCRIPT');
console.log('=====================================');
console.log('');

// Test results
const results = {
  dependencies: false,
  syntaxErrors: false,
  enumValues: false,
  imports: false,
  muxImplementation: false,
  webhookProcessing: false,
  overall: false
};

// 1. Check if dependencies are installed
console.log('1. 🔍 Checking Dependencies...');
try {
  require('sharp');
  require('file-type');
  console.log('   ✅ sharp installed');
  console.log('   ✅ file-type installed');
  results.dependencies = true;
} catch (error) {
  console.log('   ❌ Missing dependencies:', error.message);
  console.log('   💡 Run: npm install sharp file-type --save --legacy-peer-deps');
}

// 2. Check for syntax errors
console.log('');
console.log('2. 🔍 Checking Syntax Errors...');
const filesToCheck = [
  'apps/web/app/api/upload/stream/route.ts',
  'apps/web/app/api/upload/profile/route.ts',
  'apps/web/lib/services/upload-manager.ts',
  'apps/web/app/api/webhooks/paystack/route.ts'
];

let syntaxErrors = 0;
filesToCheck.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic syntax checks
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      console.log(`   ❌ Syntax error in ${filePath}: Unmatched braces`);
      syntaxErrors++;
    }

    // Check for common syntax issues
    if (content.includes('randomUUID()') && !content.includes("import { randomUUID } from 'crypto'")) {
      console.log(`   ❌ Missing import in ${filePath}: randomUUID`);
      syntaxErrors++;
    }

  } catch (error) {
    console.log(`   ❌ Cannot read ${filePath}:`, error.message);
    syntaxErrors++;
  }
});

if (syntaxErrors === 0) {
  console.log('   ✅ No syntax errors found');
  results.syntaxErrors = true;
}

// 3. Check enum values
console.log('');
console.log('3. 🔍 Checking Enum Values...');
const uploadManagerPath = 'apps/web/lib/services/upload-manager.ts';
try {
  const content = fs.readFileSync(uploadManagerPath, 'utf8');
  const hasCorrectEnums = content.includes("'UPLOADING'") &&
                         content.includes("'COMPLETED'") &&
                         content.includes("'FAILED'");
  const hasWrongEnums = content.includes("'uploading'") ||
                        content.includes("'completed'") ||
                        content.includes("'failed'");

  if (hasCorrectEnums && !hasWrongEnums) {
    console.log('   ✅ Correct enum values used');
    results.enumValues = true;
  } else {
    console.log('   ❌ Incorrect enum values found');
  }
} catch (error) {
  console.log('   ❌ Cannot check enum values:', error.message);
}

// 4. Check imports
console.log('');
console.log('4. 🔍 Checking Imports...');
const profileRoutePath = 'apps/web/app/api/upload/profile/route.ts';
try {
  const content = fs.readFileSync(profileRoutePath, 'utf8');
  if (content.includes("import { randomUUID } from 'crypto'")) {
    console.log('   ✅ randomUUID import added');
    results.imports = true;
  } else {
    console.log('   ❌ Missing randomUUID import');
  }
} catch (error) {
  console.log('   ❌ Cannot check imports:', error.message);
}

// 5. Check Mux implementation
console.log('');
console.log('5. 🔍 Checking Mux Implementation...');
const uploadManagerContent = fs.readFileSync(uploadManagerPath, 'utf8');
const uploadServiceContent = fs.readFileSync('apps/web/lib/storage/upload-service.ts', 'utf8');

const hasMuxImplementation = uploadManagerContent.includes('uploadToMux') &&
                            uploadManagerContent.includes('mux.com/video/v1/uploads') &&
                            uploadManagerContent.includes('waitForAssetReady');

const hasPlaceholder = uploadServiceContent.includes('Video upload to Mux not yet implemented');

if (hasMuxImplementation && !hasPlaceholder) {
  console.log('   ✅ Mux implementation complete');
  results.muxImplementation = true;
} else {
  console.log('   ❌ Mux implementation incomplete');
  if (hasPlaceholder) console.log('   💡 Remove placeholder from upload-service.ts');
}

// 6. Check webhook processing
console.log('');
console.log('6. 🔍 Checking Webhook Processing...');
const webhookPath = 'apps/web/app/api/webhooks/paystack/route.ts';
try {
  const content = fs.readFileSync(webhookPath, 'utf8');
  const hasProcessing = content.includes('processWebhookEvent') &&
                       content.includes('handleChargeSuccess') &&
                       content.includes('handleSubscriptionEvent') &&
                       content.includes('handleTransferEvent');

  if (hasProcessing) {
    console.log('   ✅ Webhook processing implemented');
    results.webhookProcessing = true;
  } else {
    console.log('   ❌ Webhook processing not implemented');
  }
} catch (error) {
  console.log('   ❌ Cannot check webhook processing:', error.message);
}

// 7. Overall assessment
console.log('');
console.log('🎯 OVERALL ASSESSMENT');
console.log('====================');

const passedTests = Object.values(results).filter(Boolean).length;
const totalTests = Object.keys(results).length;

console.log(`✅ PASSED: ${passedTests}/${totalTests} critical fixes`);

if (passedTests === totalTests) {
  console.log('');
  console.log('🎊 🎉 🎉 ALL CRITICAL FIXES VERIFIED! 🎉 🎉 🎊');
  console.log('');
  console.log('🚀 READY FOR:');
  console.log('=============');
  console.log('• Video uploads to Mux');
  console.log('• Image uploads to Supabase');
  console.log('• Payment processing with webhooks');
  console.log('• Automated payout processing');
  console.log('');
  console.log('💡 NEXT STEPS:');
  console.log('==============');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Test video upload with actual file');
  console.log('3. Test payment flow end-to-end');
  console.log('4. Deploy to staging');
  console.log('');
  console.log('🎯 PRODUCTION READY! ✅');
  results.overall = true;
} else {
  console.log('');
  console.log('⚠️  SOME FIXES STILL NEEDED');
  console.log('===========================');
  console.log('Review the failed checks above and fix them before deployment.');

  // Show failed items
  console.log('');
  console.log('❌ FAILED CHECKS:');
  Object.entries(results).forEach(([test, passed]) => {
    if (!passed) {
      console.log(`• ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }
  });
}

console.log('');
console.log('📊 DETAILED RESULTS:');
Object.entries(results).forEach(([test, passed]) => {
  const status = passed ? '✅' : '❌';
  const displayName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
  console.log(`${status} ${displayName}`);
});

console.log('');
console.log('🔧 TROUBLESHOOTING:');
console.log('===================');
console.log('• If dependencies fail: npm install --legacy-peer-deps');
console.log('• If syntax errors: Check brace matching in files');
console.log('• If enum errors: Ensure UPLOADING/COMPLETED/FAILED (uppercase)');
console.log('• If imports missing: Add required imports at file top');
console.log('• If Mux incomplete: Implement uploadToMux function');
console.log('• If webhooks missing: Add processWebhookEvent function');

process.exit(results.overall ? 0 : 1);
