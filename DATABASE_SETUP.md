# Database Setup Guide

## Current Status

- ✅ Prisma client generated
- ✅ Environment variables configured
- ⚠️ Database connection pending

## Database Connection Issue

**⚠️ IPv4 Compatibility Issue Identified**

The database connection is failing because Supabase's direct connection requires IPv6, but your network is IPv4-only.

**Solution: Use Session Pooler**

Supabase provides a Session Pooler that works with IPv4 networks. Update your connection string to use the pooler format.

### Connection String Formats

**Direct Connection (IPv6 only - not working):**
```
postgresql://postgres:[PASSWORD]@db.xdwocaugiyjtbbzwpbid.supabase.co:5432/postgres
```

**Session Pooler (IPv4 compatible - use this):**
```
postgresql://postgres.xdwocaugiyjtbbzwpbid:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Or with connection parameters:
```
postgresql://postgres.xdwocaugiyjtbbzwpbid:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 1. IP Restrictions in Supabase

Supabase may have IP restrictions enabled. To fix:

1. Go to your Supabase project: https://supabase.com/dashboard/project/xdwocaugiyjtbbzwpbid
2. Navigate to: **Settings > Database > Connection Pooling**
3. Check if there are any IP restrictions
4. Add your current IP address to the allowed list, or disable restrictions for development

### 2. Network/Firewall Issues

- Check if port 5432 is blocked by your firewall
- Try using a VPN if you're behind a corporate firewall
- Verify your internet connection

### 3. Connection String Format

Make sure you're using the exact connection string from Supabase:

1. Go to: **Settings > Database > Connection String**
2. Select **URI** format
3. Copy the exact string (should look like):
   ```
   postgresql://postgres:[PASSWORD]@db.xdwocaugiyjtbbzwpbid.supabase.co:5432/postgres
   ```
4. Update `packages/database/.env` with the exact string

## Setting Up the Database

Once the connection works, run:

```bash
cd packages/database
npx prisma db push
```

This will create all the tables in your Supabase database:
- users
- creators
- creator_plans
- fan_subscriptions
- content
- transactions
- payouts
- platform_subscriptions

## Alternative: Use Supabase SQL Editor

If Prisma connection continues to fail, you can create the tables manually:

1. Go to Supabase dashboard
2. Navigate to: **SQL Editor**
3. Run the SQL migration (we can generate this from Prisma schema if needed)

## Verifying Connection

Test the connection:

```bash
cd packages/database
npx prisma db pull  # This will test the connection
```

## Next Steps

1. Fix the database connection issue (IP whitelist, network, etc.)
2. Run `npx prisma db push` to create tables
3. Verify tables are created in Supabase dashboard
4. Start using the application!

