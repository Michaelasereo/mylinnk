# Phase 2 Environment Variables

## Required for Webhook Queue System

Add these environment variables to your `.env.local` file:

```bash
# Redis Configuration (for BullMQ queue management)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional Redis settings
REDIS_PASSWORD=your-redis-password  # if using authentication
REDIS_DB=0                          # Redis database number
```

## Installation Steps

### 1. Install Redis
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Install Dependencies
```bash
cd apps/web
pnpm install
# bullmq and ioredis should now be installed
```

### 3. Start the Webhook Worker
```bash
# Terminal 1: Start the webhook worker
cd apps/web
npx tsx scripts/start-webhook-worker.ts

# Terminal 2: Start the main application
pnpm dev
```

## Environment Variables Documentation

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `REDIS_URL` | Full Redis connection URL | `redis://localhost:6379` | Yes |
| `REDIS_HOST` | Redis server hostname | `localhost` | No |
| `REDIS_PORT` | Redis server port | `6379` | No |
| `REDIS_PASSWORD` | Redis authentication password | - | No |
| `REDIS_DB` | Redis database number | `0` | No |

## Testing the Setup

### 1. Verify Redis Connection
```bash
# Connect to Redis CLI
redis-cli

# Test basic operations
SET test "Hello World"
GET test
DEL test
```

### 2. Test Webhook Queue
```bash
# The webhook worker should log connection success
# You should see: "📋 Worker will process webhooks from the 'webhooks' queue"
```

### 3. Test Admin Dashboard
```bash
# Visit: http://localhost:3000/admin/reconciliation
# Should show reconciliation stats (may be empty initially)
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
redis-cli monitor
```

### Worker Startup Issues
```bash
# Check for TypeScript compilation errors
npx tsc --noEmit

# Check for missing dependencies
pnpm install
```

### Queue Monitoring
```bash
# Check active queues
redis-cli KEYS "bull:*"

# Monitor queue activity
redis-cli monitor
```

## Production Considerations

### Redis Configuration
- Use Redis Cluster for high availability
- Enable persistence (RDB/AOF)
- Set appropriate memory limits
- Configure authentication in production

### Worker Scaling
- Run multiple worker instances behind a load balancer
- Use PM2 or similar process manager
- Monitor worker health and restart failed workers

### Queue Monitoring
- Implement queue health monitoring
- Set up alerts for queue depth
- Monitor dead letter queue growth

---

*Note: These environment variables are required for the Phase 2 webhook retry queue system. The existing Paystack and Supabase variables remain unchanged.*
