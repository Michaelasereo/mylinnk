# How to Get Session Pooler Connection String

## The Issue

Your network is IPv4-only, but Supabase's direct connection requires IPv6. You need to use the **Session Pooler** instead.

## Steps to Get the Correct Connection String

### Option 1: From the Connection Dialog

1. In the Supabase dashboard, you should see a warning about IPv4 compatibility
2. Click the **"Pooler settings"** button in that warning
3. This will show you the Session Pooler connection string
4. Copy that exact string

### Option 2: From Settings

1. Go to your Supabase project: https://supabase.com/dashboard/project/xdwocaugiyjtbbzwpbid
2. Navigate to: **Settings > Database > Connection Pooling**
3. Make sure **Session mode** is selected (not Transaction mode)
4. Copy the connection string shown
5. It should look something like:
   ```
   postgresql://postgres.xdwocaugiyjtbbzwpbid:[PASSWORD]@[POOLER-HOST]:6543/postgres
   ```

### Option 3: From Connection String Tab

1. In the "Connect to your project" dialog
2. Click on the **"Connection String"** tab
3. Change the **"Method"** dropdown from "Direct connection" to **"Session Pooler"**
4. The connection string will update automatically
5. Copy that string

## Update Your Environment File

Once you have the correct connection string:

1. Open `packages/database/.env`
2. Replace the `DATABASE_URL` with the exact string from Supabase
3. Make sure your password is included (replace `[YOUR-PASSWORD]` with `Adenike2026`)

Example:
```env
DATABASE_URL=postgresql://postgres.xdwocaugiyjtbbzwpbid:Adenike2026@[EXACT-POOLER-HOST]:6543/postgres
```

## Then Run Database Setup

```bash
cd packages/database
npx prisma db push
```

This should work once you have the correct pooler connection string from Supabase!

