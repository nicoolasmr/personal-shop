# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Supabase project with credentials
- (Optional) Kubernetes cluster access

## ⚠️ Security: Never Hardcode Secrets

**CRITICAL:** API keys and secrets must NEVER be committed to source code.

- ❌ Don't put real keys in `src/config/supabase.ts`
- ❌ Don't commit `.env` files with real values
- ✅ Use environment variables at build time
- ✅ Use secret management (Lovable Secrets, K8s Secrets, etc.)

## Environment Variables

### Build-Time vs Runtime

Since VIDA360 is a Vite frontend app, environment variables are **embedded at build time**:

```
VITE_* variables → Bundled into JavaScript at build → Cannot change at runtime
```

This means you must rebuild the container when credentials change.

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

### Create .env File (Local Development Only)

```bash
cp .env.example .env
# Edit .env with your values - NEVER COMMIT THIS FILE
```

## Docker

### Build Image (with credentials)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t vida360:latest .
```

### Run Container

```bash
docker run -d -p 3000:80 --name vida360 vida360:latest
```

### Docker Compose (Recommended)

```bash
# Option 1: Export env vars first
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key
docker-compose up -d

# Option 2: Use .env file (auto-loaded by docker-compose)
docker-compose up -d
```

To stop:

```bash
docker-compose down
```

### Verify Deployment

```bash
# Check container health
docker ps

# View logs
docker logs vida360-app

# Test the app
curl http://localhost:3000
```

## Kubernetes

### Prerequisites

- `kubectl` configured with cluster access
- Container image pushed to a registry

### Push Image to Registry

```bash
# Tag for your registry
docker tag vida360:latest your-registry/vida360:latest

# Push
docker push your-registry/vida360:latest
```

### Update Deployment Image

Edit `k8s/deployment.yaml` to use your registry:

```yaml
image: your-registry/vida360:latest
```

### Configure Secrets

**IMPORTANT**: Never commit real secrets. Update `k8s/secret.yaml` with base64-encoded values:

```bash
# Encode your values
echo -n "https://your-project.supabase.co" | base64
echo -n "your-anon-key" | base64
```

For production, use [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or your cloud provider's secret management.

### Deploy

```bash
# Create namespace (optional)
kubectl create namespace vida360

# Apply manifests in order
kubectl apply -f k8s/configmap.yaml -n vida360
kubectl apply -f k8s/secret.yaml -n vida360
kubectl apply -f k8s/deployment.yaml -n vida360
kubectl apply -f k8s/service.yaml -n vida360
kubectl apply -f k8s/ingress.yaml -n vida360
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n vida360

# Check service
kubectl get svc -n vida360

# View logs
kubectl logs -l app=vida360 -n vida360

# Port forward for testing
kubectl port-forward svc/vida360-service 3000:80 -n vida360
```

### Ingress Configuration

Update `k8s/ingress.yaml` with your domain:

```yaml
spec:
  rules:
    - host: vida360.yourdomain.com
```

For TLS, uncomment the TLS section and configure cert-manager.

## Health Check

The application provides a health endpoint via Supabase Edge Function:

```bash
# Edge function health check
curl https://your-project.supabase.co/functions/v1/health
```

Response:
```json
{
  "status": "ok",
  "service": "vida360",
  "env": "production",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "supabase": {
    "configured": true,
    "connected": true
  }
}
```

## Troubleshooting

### Container won't start

1. Check environment variables are set
2. Verify Supabase credentials are correct
3. Check logs: `docker logs vida360-app`

### Blank page in browser

1. Verify Supabase URL and anon key are correct
2. Check browser console for errors
3. Ensure Supabase project is active

### Kubernetes pods not ready

1. Check pod logs: `kubectl logs <pod-name> -n vida360`
2. Verify secrets are correctly encoded
3. Check resource limits
