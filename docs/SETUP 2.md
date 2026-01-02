# Setup Guide

## Environment Variables

**CRITICAL: Never hardcode API keys or secrets in source code!**

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API |

### Configuring in Lovable

1. Go to your Lovable project settings
2. Navigate to **Cloud** → **Secrets**
3. Add each variable with its value
4. The app will automatically use these at build time

### Configuring for Docker/Kubernetes

For containerized deployments, pass environment variables at **build time**:

```bash
# Docker build with env vars
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t vida360:latest .
```

**Important:** Since this is a Vite frontend app, environment variables are embedded at build time (not runtime). You must rebuild the container when credentials change.

### Local Development with .env

Create a `.env` file (never commit this):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run the migration SQL in `supabase/migrations/0001_init.sql` in your Supabase SQL Editor.

## Local Development

The app runs automatically in Lovable's preview.

## Validation

The app validates environment variables at startup. If they're missing, you'll see a friendly error message instead of a blank screen.
