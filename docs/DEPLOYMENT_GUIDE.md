# Agent Store - Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- GitHub account
- Vercel account
- n8n cloud account (optional: self-hosted n8n)

### 1. Frontend Deployment

**Step 1: Deploy to Vercel**
1. Connect GitHub repository to Vercel
2. Select framework: **Vite**
3. Build settings (auto-detected):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `.` (leave empty)

**Step 2: Environment Variables**
```env
VITE_API_BASE_URL=https://your-backend.vercel.app
```

### 2. Backend Deployment

**Step 1: Deploy Backend**
1. Create new Vercel project for backend
2. Set Root Directory: `server`
3. Framework: **Other**

**Step 2: Database Setup**
1. Go to Storage tab in Vercel project
2. Choose **Marketplace** → **Upstash** → **Redis**
3. Create database named `upstash-kv-agent-store`
4. Connect to project (auto-adds environment variables)

**Step 3: Verify Environment Variables**
Should auto-populate:
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. n8n Workflow Setup

**Landing Analyzer Workflow:**
1. Webhook Trigger: `https://neulandai.app.n8n.cloud/webhook/landing-analyzer`
2. Callback URL: `https://your-backend.vercel.app/api/landing-analyzer/callback`
3. Expected payload:
   ```json
   {
     "website_url": "https://example.com",
     "job_id": "job_1757939322111_xy46edf7t",
     "callback_url": "https://your-backend.vercel.app/api/landing-analyzer/callback"
   }
   ```

**SEO Audit Workflow:**
1. Webhook Trigger: `https://neulandai.app.n8n.cloud/webhook/seo-audit-agent`
2. Callback URL: `https://your-backend.vercel.app/api/seo/callback`
3. Same payload structure as Landing Analyzer

## 🔧 Configuration Files

### Frontend (Root Directory)

**vercel.json**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

### Backend (server/ Directory)

**vercel.json**
```json
{
  "version": 2,
  "buildCommand": "echo 'No build required for serverless functions'",
  "outputDirectory": ".",
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3.2.17"
    }
  },
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

**package.json**
```json
{
  "name": "agent-store-backend",
  "type": "module",
  "dependencies": {
    "@upstash/redis": "^1.28.2"
  },
  "engines": {
    "node": "20.x"
  }
}
```

## 🧪 Testing Deployment

### Health Checks
```bash
# Backend health
curl https://your-backend.vercel.app/api/health

# Expected response
{"status":"ok","timestamp":"...","service":"Agent Store Backend API"}
```

### API Endpoints
```bash
# Test status endpoint (should return 404 for non-existent job)
curl "https://your-backend.vercel.app/api/landing-analyzer/status?jobId=test"

# Expected response
{"error":"Job not found","jobId":"test"}
```

### Frontend
1. Visit your frontend URL
2. Navigate to "Agents Store"
3. Try Landing Analyzer with a test URL
4. Verify loading state and result display

## 🔍 Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure `"type": "module"` in backend package.json
- Use `.js` extensions in import statements

**CORS errors:**
- Verify CORS headers in API functions
- Check environment variable configuration

**Redis connection failed:**
- Verify Upstash Redis is connected to project
- Check environment variables are set

**n8n callback not working:**
- Verify callback URL uses production backend URL
- Check n8n workflow is active and properly configured

### Debug Commands
```bash
# View Vercel logs
vercel logs [deployment-url]

# Local development
npm run dev          # Frontend
cd server && vercel dev  # Backend
```

## 🔄 CI/CD Pipeline

**Automatic Deployment:**
1. Push to `main` branch
2. Vercel auto-builds and deploys both projects
3. New URLs remain consistent (production domains)

**Manual Deployment:**
```bash
# Frontend
vercel --prod

# Backend
cd server && vercel --prod
```

## 🚨 Production Checklist

**Before Going Live:**
- [ ] Environment variables configured
- [ ] Redis database connected
- [ ] n8n workflows tested
- [ ] Health checks passing
- [ ] CORS properly configured
- [ ] Custom domain setup (optional)
- [ ] Monitoring configured
- [ ] Error tracking enabled

**Security:**
- [ ] Remove debug logs from production
- [ ] Implement rate limiting (if needed)
- [ ] Add authentication (if required)
- [ ] Review environment variable access

## 📊 Monitoring Setup

**Vercel Dashboard:**
- Function performance metrics
- Error rates and logs
- Traffic patterns

**Upstash Dashboard:**
- Redis memory usage
- Connection statistics
- Query performance

**Custom Monitoring:**
```javascript
// Add to critical functions
console.log('Function execution:', {
  timestamp: new Date().toISOString(),
  function: 'agent-start',
  jobId: jobId,
  status: 'success'
});
```