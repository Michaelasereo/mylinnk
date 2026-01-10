# 🚨 **VIDEO UPLOAD FAILURE - COMPREHENSIVE DEBUG GUIDE**

## **Immediate Action Items**

### **Step 1: Enhanced Console Logging**
Add these console logs to your browser's content creation page (`/content/new`) to track the upload process:

```javascript
// Add this to the handleFileUpload function in your React component
async function handleFileUpload(file: File) {
  console.log('🚀 UPLOAD DEBUG START');
  console.log('📁 File Details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });

  // Check file before upload
  if (file.size === 0) {
    console.error('❌ File is empty!');
    return;
  }

  if (file.size > 100 * 1024 * 1024) {
    console.error('❌ File too large:', file.size, 'bytes (max: 100MB)');
    return;
  }

  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
  if (!allowedTypes.includes(file.type)) {
    console.error('❌ Invalid file type:', file.type, '- Allowed:', allowedTypes);
    return;
  }

  console.log('✅ File validation passed');

  // Prepare FormData
  const formData = new FormData();
  formData.append('file', file);
  console.log('📦 FormData prepared, file appended');

  // Check authentication
  console.log('🔐 Checking authentication...');
  const authCheck = await fetch('/api/health/env-check');
  console.log('Auth check response:', authCheck.status);

  console.log('📤 Starting upload to /api/upload/stream...');
  const uploadStart = Date.now();

  try {
    const response = await fetch('/api/upload/stream', {
      method: 'POST',
      body: formData,
    });

    const uploadTime = Date.now() - uploadStart;
    console.log('⏱️ Upload response time:', uploadTime + 'ms');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📋 Parsed response:', responseData);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      console.log('Raw response text:', responseText);
    }

    if (!response.ok) {
      console.error('❌ Upload failed with status:', response.status);
      console.error('Error details:', responseData);
      throw new Error(responseData?.error || 'Upload failed');
    }

    console.log('✅ Upload successful!');
    console.log('🎬 Mux Playback URL:', responseData?.data?.playbackUrl);

  } catch (error) {
    console.error('💥 Upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
  }

  console.log('🏁 UPLOAD DEBUG END');
}
```

### **Step 2: Server-Side Debug Enhancement**
Add these debug logs to your upload API endpoint temporarily:

```typescript
// Add at the top of POST function in /api/upload/stream/route.ts
console.log('🔍 SERVER DEBUG: Upload API called at', new Date().toISOString());
console.log('🔍 SERVER DEBUG: Request method:', request.method);
console.log('🔍 SERVER DEBUG: Request headers:', Object.fromEntries(request.headers.entries()));
console.log('🔍 SERVER DEBUG: Content-Type:', request.headers.get('content-type'));
console.log('🔍 SERVER DEBUG: Content-Length:', request.headers.get('content-length'));
```

### **Step 3: Network Debugging**
Open your browser's DevTools (F12) and:

1. **Go to Network tab**
2. **Filter by "upload"**
3. **Enable "Preserve log"**
4. **Check "Disable cache"**

When you upload, look for:
- Request to `/api/upload/stream`
- Response status and size
- Any failed network requests
- CORS errors

---

## **🔍 COMMON FAILURE POINTS & SOLUTIONS**

### **1. Authentication Failures**
**Symptoms:** 401 error, "Authentication failed"
**Debug Steps:**
```javascript
// Check if user is logged in
console.log('Current user session:', await supabase.auth.getSession());
console.log('Current user:', await supabase.auth.getUser());
```

**Solutions:**
- Ensure user is logged in before upload
- Check Supabase session expiry
- Verify JWT token validity

### **2. File Validation Failures**
**Symptoms:** 400 error with validation messages
**Debug Steps:**
```javascript
console.log('File validation check:');
console.log('- Size:', file.size, 'bytes (max: 104857600)');
console.log('- Type:', file.type, '(allowed: video/mp4, video/webm, video/quicktime, video/x-matroska)');
console.log('- Empty check:', file.size === 0);
```

**Common Issues:**
- **Wrong file type:** Browser reports wrong MIME type
- **Corrupted file:** File.size = 0 or corrupted
- **Size limit:** File exceeds 100MB

### **3. Mux API Failures**
**Symptoms:** 500 error with "Mux API error"
**Debug Steps:**
```javascript
// Check Mux credentials
console.log('Mux Token ID exists:', !!process.env.MUX_TOKEN_ID);
console.log('Mux Token Secret exists:', !!process.env.MUX_TOKEN_SECRET);

// Check API call
const muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {...});
console.log('Mux API response:', {
  status: muxResponse.status,
  statusText: muxResponse.statusText,
  headers: Object.fromEntries(muxResponse.headers.entries())
});
```

**Common Mux Issues:**
- **Invalid credentials:** Check MUX_TOKEN_ID and MUX_TOKEN_SECRET
- **Rate limiting:** Mux API rate limits
- **Invalid request:** Check request payload format

### **4. Database Connection Issues**
**Symptoms:** Prisma errors, connection timeouts
**Debug Steps:**
```javascript
try {
  await prisma.$connect();
  console.log('✅ Database connected');
} catch (error) {
  console.error('❌ Database connection failed:', error);
}
```

### **5. Network/Fetch Issues**
**Symptoms:** Network errors, timeouts, CORS issues
**Debug Steps:**
```javascript
// Check network connectivity
fetch('https://api.mux.com/video/v1/uploads', {
  method: 'HEAD'
}).then(response => {
  console.log('Mux API reachable:', response.status);
}).catch(error => {
  console.error('Mux API unreachable:', error);
});
```

---

## **🛠️ QUICK FIXES TO TRY**

### **Fix 1: Clear Browser Cache**
```bash
# Hard refresh the page
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### **Fix 2: Restart Development Server**
```bash
# Kill current server
pkill -f "next dev"

# Restart
cd /Users/macbook/Desktop/ealhe/apps/web
npm run dev
```

### **Fix 3: Test with Small File**
Try uploading a very small video file (< 1MB) to isolate issues:
- If small file works: File size/network issue
- If small file fails: Authentication/validation issue

### **Fix 4: Check File Integrity**
```bash
# Test file before upload
file /path/to/your/video.mp4
# Should show: "video/mp4" or similar
```

---

## **📊 DEBUG CHECKLIST**

**Before Upload:**
- [ ] User is logged in (check browser console)
- [ ] File is valid (size, type, not corrupted)
- [ ] Network connection is stable
- [ ] Dev server is running on port 3000

**During Upload:**
- [ ] Browser console shows "UPLOAD DEBUG START"
- [ ] File validation passes
- [ ] FormData is created correctly
- [ ] Network request to `/api/upload/stream` is sent

**Server-Side:**
- [ ] API receives the request
- [ ] Authentication succeeds
- [ ] File validation passes
- [ ] Mux API call succeeds
- [ ] Database updates work

**After Upload:**
- [ ] Success response received
- [ ] Content record created
- [ ] File appears in creator dashboard

---

## **🎯 SPECIFIC DEBUGGING FOR YOUR CASE**

Since your upload failed, let's systematically check:

### **Step 1: Browser Console Check**
When you try the upload again, look for these specific error patterns:

1. **"Authentication failed"** → Login issue
2. **"File too large"** → Size limit exceeded
3. **"Unsupported file type"** → Wrong file format
4. **"Mux API error"** → Mux service issue
5. **Network error** → Connection problem

### **Step 2: Network Tab Analysis**
In DevTools Network tab, check:
- Request method: `POST`
- Request URL: `http://localhost:3000/api/upload/stream`
- Request headers include authentication
- Response status and body

### **Step 3: Server Logs**
Check your terminal where `npm run dev` is running for:
- Authentication errors
- Database connection issues
- Mux API failures
- File processing errors

---

## **🚨 EMERGENCY DEBUG SCRIPT**

Run this in your browser console before uploading:

```javascript
// Emergency debug setup
window.DEBUG_UPLOAD = true;

console.log('🚨 EMERGENCY DEBUG ENABLED');
console.log('📊 Current environment:');
console.log('- URL:', window.location.href);
console.log('- User agent:', navigator.userAgent);
console.log('- Online:', navigator.onLine);

// Override the upload function temporarily
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch call:', args[0], args[1]?.method || 'GET');
  if (args[0].includes('upload/stream')) {
    console.log('🎬 UPLOAD REQUEST DETECTED');
    console.log('Request details:', args[1]);
  }
  return originalFetch.apply(this, args)
    .then(response => {
      if (args[0].includes('upload/stream')) {
        console.log('🎬 UPLOAD RESPONSE:', response.status, response.statusText);
        // Clone response to read body without consuming it
        response.clone().text().then(text => {
          console.log('🎬 UPLOAD RESPONSE BODY:', text.substring(0, 500));
        });
      }
      return response;
    });
};

console.log('✅ Debug hooks installed. Try uploading now!');
```

---

## **🎯 NEXT STEPS**

1. **Add the debug logging** to your content creation page
2. **Try uploading again** and capture all console logs
3. **Share the exact error** and console output
4. **Check the server logs** for backend errors

**What specific error message did you see when the upload failed?** Share the exact error and console logs, and I'll provide targeted fixes!

---

**Debug Guide Created:** January 10, 2026
**Ready for Upload Testing:** Yes
