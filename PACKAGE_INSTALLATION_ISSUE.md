# Package Installation Issue - Comprehensive Assessment

**Date:** January 3, 2025  
**Issue:** Tailwind CSS and related packages keep disappearing after installation  
**Status:** Root Cause Identified

---

## Executive Summary

Packages (`tailwindcss`, `tailwindcss-animate`, `autoprefixer`, `postcss`) are being installed but not persisting in `node_modules`. The root cause is **duplicate dependency declarations** in both root and workspace `package.json` files, causing npm workspace hoisting conflicts.

---

## Root Cause Analysis

### 1. **Duplicate Dependency Declarations**

**Problem:** The same packages are declared in TWO locations:

#### Root `package.json` (Line 19-27):
```json
"devDependencies": {
  "@biomejs/biome": "^1.9.4",
  "autoprefixer": "^10.4.23",        // ❌ DUPLICATE
  "postcss": "^8.5.6",               // ❌ DUPLICATE
  "tailwindcss": "^3.4.19",          // ❌ DUPLICATE
  "tailwindcss-animate": "^1.0.7",   // ❌ DUPLICATE
  "turbo": "^2.3.3",
  "typescript": "^5.7.2"
}
```

#### `apps/web/package.json` (Line 56-72):
```json
"devDependencies": {
  "@biomejs/biome": "^1.9.4",
  "@playwright/test": "^1.48.0",
  // ... other packages ...
  "autoprefixer": "^10.4.23",        // ❌ DUPLICATE
  "postcss": "^8.5.6",               // ❌ DUPLICATE
  "tailwindcss": "^3.4.19",          // ❌ DUPLICATE
  "tailwindcss-animate": "^1.0.7",   // ❌ DUPLICATE
  "typescript": "5.9.3",
  "vitest": "^2.1.8"
}
```

### 2. **npm Workspaces Hoisting Conflict**

**How npm workspaces work:**
- npm tries to hoist dependencies to the root `node_modules` when possible
- When the same package is declared in both root and workspace, npm may:
  - Install it in root (if versions match)
  - Install it in workspace (if versions differ)
  - Fail to install correctly (if there's a conflict)

**What's happening:**
1. Packages are installed successfully (`npm install` reports success)
2. npm resolves the conflict by installing in root OR workspace
3. But Turbopack/Next.js can't find them because:
   - They're hoisted to root but Turbopack looks in workspace
   - OR they're in workspace but workspace `node_modules` doesn't exist (workspaces don't create workspace `node_modules` by default)

### 3. **Turbopack Module Resolution Issue**

**Additional Problem:**
- Turbopack (Next.js 16's bundler) has module resolution issues with npm workspaces
- Even when packages ARE installed, Turbopack can't find them because:
  - It's looking in the wrong location
  - The `turbopack.root` configuration may not be resolving correctly

---

## Evidence

### Installation Attempts:
```bash
$ npm install tailwindcss@3.4.19 --save-dev
# Reports: "added 1 package" or "up to date"

$ ls node_modules/tailwindcss
# Result: No such file or directory ❌

$ npm list tailwindcss
# Result: (empty) ❌
```

### Package.json State:
- ✅ Packages ARE in `package.json` files
- ❌ Packages are NOT in `node_modules`
- ❌ `npm list` shows empty

### Build Errors:
```
Error: Cannot find module 'tailwindcss'
Error: Cannot find module 'tailwindcss-animate'
```

---

## Why Packages Disappear

### Theory 1: Workspace Hoisting Conflict (Most Likely)
- npm installs packages but places them in an unexpected location
- When we check `node_modules`, they're not where we expect
- They might be in a symlink or hoisted location that's not accessible

### Theory 2: Installation Failure (Less Likely)
- npm reports success but actually fails silently
- Package-lock.json might be corrupted
- npm cache might be corrupted

### Theory 3: Post-Install Cleanup (Unlikely)
- No scripts found that delete `node_modules`
- `.gitignore` doesn't affect installed packages
- No CI/CD running that would clean

---

## Solution

### **Recommended Fix: Remove Duplicates**

**Best Practice:** In a monorepo, dependencies should be declared in the workspace that uses them, NOT in the root.

**Action Plan:**

1. **Remove from root `package.json`:**
   - Remove `tailwindcss`
   - Remove `tailwindcss-animate`
   - Remove `autoprefixer`
   - Remove `postcss`
   
   **Keep in root only:**
   - `turbo` (needed for monorepo management)
   - `@biomejs/biome` (if used across workspaces)
   - `typescript` (if used across workspaces)

2. **Keep in `apps/web/package.json`:**
   - All Tailwind-related packages should ONLY be here
   - This is the workspace that actually uses them

3. **Clean and Reinstall:**
   ```bash
   rm -rf node_modules package-lock.json apps/web/node_modules
   npm install --legacy-peer-deps
   ```

4. **Verify Installation:**
   ```bash
   npm list tailwindcss --workspace=apps/web
   ls node_modules/tailwindcss  # Should exist
   ```

5. **Fix Turbopack Resolution (if still needed):**
   - Update `next.config.js` with proper module resolution
   - Or use relative paths in `turbopack.resolveAlias`

---

## Alternative Solutions

### Option 2: Keep in Root Only
- Remove from `apps/web/package.json`
- Keep only in root
- **Pros:** Single source of truth
- **Cons:** Root shouldn't have app-specific dependencies

### Option 3: Use .npmrc Configuration
- Add `.npmrc` with `shamefully-hoist=true` (if using pnpm)
- Or configure workspace hoisting explicitly
- **Note:** This is a workaround, not a fix

---

## Verification Steps

After implementing the fix:

1. ✅ Check `package.json` files - no duplicates
2. ✅ Run `npm install` - should succeed
3. ✅ Verify `node_modules/tailwindcss` exists
4. ✅ Run `npm list tailwindcss` - should show package
5. ✅ Run `npm run build` - should succeed
6. ✅ Check build output - no module errors

---

## Prevention

1. **Follow monorepo best practices:**
   - Root `package.json` = shared tooling only
   - Workspace `package.json` = workspace-specific dependencies

2. **Use dependency management tools:**
   - Consider using `syncpack` to detect duplicates
   - Use `npm-check-updates` to manage versions

3. **Documentation:**
   - Document which packages belong where
   - Add comments in `package.json` if needed

---

## Related Issues

- **Turbopack module resolution:** Still needs to be addressed separately
- **Peer dependency conflicts:** `@sentry/nextjs` vs Next.js 16 (requires `--legacy-peer-deps`)
- **Workspace root detection:** Fixed with `turbopack.root` config

---

**Next Steps:**
1. ✅ Remove duplicate dependencies from root `package.json` - DONE
2. ⚠️ Clean install - IN PROGRESS (packages still not appearing)
3. ⏳ Test build
4. ⏳ Update documentation

---

## Additional Findings

### Issue Persists After Fix

Even after removing duplicates:
- ✅ `package.json` files are correct (no duplicates)
- ✅ `package-lock.json` shows tailwindcss entries
- ❌ `node_modules/tailwindcss` does NOT exist
- ❌ `npm ls tailwindcss` shows empty
- ❌ Build still fails with "Cannot find module 'tailwindcss'"

### Possible Causes:

1. **Corrupted package-lock.json state**
   - npm thinks packages are installed (reports "up to date")
   - But packages don't actually exist in node_modules
   - Solution: Delete package-lock.json and reinstall

2. **npm workspace hoisting bug**
   - npm workspaces may have a bug with certain packages
   - Packages are "installed" but not accessible
   - Solution: Try installing directly in workspace with local node_modules

3. **Turbopack-specific issue**
   - Packages might be installed but Turbopack can't resolve them
   - This is a known issue with Turbopack + npm workspaces
   - Solution: Use webpack instead, or configure module resolution

### Recommended Next Steps:

1. **Complete clean reinstall:**
   ```bash
   rm -rf node_modules package-lock.json apps/*/node_modules packages/*/node_modules
   npm install --legacy-peer-deps
   ```

2. **If still not working, try installing in workspace directly:**
   ```bash
   cd apps/web
   npm install tailwindcss@3.4.19 tailwindcss-animate@1.0.7 autoprefixer postcss --save-dev
   ```

3. **If Turbopack is the issue, disable it:**
   - Use webpack instead (Next.js 16 still supports it)
   - Or wait for Turbopack workspace support to improve

