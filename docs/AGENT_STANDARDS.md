# Agent Store - Agent Standards & Development Guide

## 🔍 Agent Audit Results

### Current Agent Architecture

The Agent Store currently has **15 agents** split into two distinct patterns:

#### 🔗 API-Based Agents (2 agents)
Agents with backend persistence, job tracking, and callback systems:
- **Landing Page Analyzer** (`landing`) - Uses `/api/landing-analyzer/*` endpoints
- **SEO Audit Agent** (`seo`) - Uses `/api/seo/*` endpoints

#### 📝 Form-Based Agents (13 agents)
Direct webhook agents with immediate responses:
- Support Agent, Website Intelligence, Ops Agent, Research Agent, Lead Generator, Image Generation, Competitor Tracker, Pricing Scraper, Social Listening, Email Drafting, Ad Copy Generator, Blog Outline Generator, Newsletter Curator

## 📋 Standardization Requirements

### 1. Critical Issues Found

**Inconsistent Response Handling:**
- Different form components use different patterns for parsing responses
- Some expect `reply[0].File_url`, others expect `url`, `link`, `report_url`
- No standard error handling across agents

**Missing Backend Endpoints:**
- Only 2 out of 15 agents have proper backend API endpoints
- No job persistence for most agents
- No status tracking for form-based agents

**UI/UX Inconsistencies:**
- EmailDraftingForm uses chat interface while others use simple forms
- Different loading states and error messages
- Inconsistent form validation

### 2. Recommended Standards

#### Backend API Pattern (Recommended for All Agents)

Every agent should follow this structure:
```
server/api/{agent-name}/
├── start.js      # POST - Create job, trigger n8n workflow
├── callback.js   # POST - Receive n8n results
└── status.js     # GET - Check job status
```

#### Standard Response Format

**n8n Callback Contract:**
```json
{
  "job_id": "job_1757939322111_xy46edf7t",
  "reply": [
    {
      "File_url": "https://result-file-url.com/report.pdf",
      "title": "Report Name",
      "status": "completed"
    }
  ],
  "error": "Error message if failed"
}
```

**Frontend Status Response:**
```json
{
  "id": "job_xxx",
  "status": "pending|processing|completed|failed",
  "result": { /* n8n response */ },
  "createdAt": "2025-09-15T12:05:51.790Z",
  "completedAt": "2025-09-15T12:06:23.445Z",
  "error": "Error message if failed"
}
```

#### Frontend Form Standards

**Required Imports:**
```typescript
import React, { useState } from 'react';
import { ChatIcon, SettingsIcon } from '../components/icons';
import LoadingDog from '../components/LoadingDog';
```

**Standard State Management:**
```typescript
const [status, setStatus] = useState<'idle' | 'sending' | 'completed' | 'error'>('idle');
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [jobId, setJobId] = useState<string | null>(null);
const [result, setResult] = useState<any>(null);
```

**Polling Pattern (for API-based agents):**
```typescript
useEffect(() => {
  if (!jobId || status !== 'sending') return;

  const pollStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/${agentType}/status?jobId=${jobId}`);
      const data = await response.json();

      if (data.status === 'completed') {
        setResult(data.result);
        setStatus('completed');
      } else if (data.status === 'failed') {
        setErrorMsg(data.error || 'Agent failed');
        setStatus('error');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const interval = setInterval(pollStatus, 2000);
  return () => clearInterval(interval);
}, [jobId, status]);
```

## 🛠️ Migration Plan

### Phase 1: Standardize Existing API-Based Agents ✅
- [x] Landing Analyzer - Already standardized
- [x] SEO Audit - Already standardized

### Phase 2: Migrate High-Priority Form Agents to API Pattern
Recommended order based on complexity and usage:

1. **Research Agent** - Simple form, high usage
2. **Lead Generator** - Complex form, business critical
3. **Image Generation** - Visual output, good test case
4. **Website Intelligence (Sales)** - File output, important

### Phase 3: Standardize Remaining Form Agents
5. Email Drafting, Ad Copy Generator, Blog Outline, Newsletter Curator
6. Support, Ops, Competitor Tracker, Pricing Scraper, Social Listening

## 🎯 Implementation Guide

### Creating a New API-Based Agent

**1. Backend Setup**
```bash
mkdir server/api/[agent-name]
# Copy from existing pattern (landing-analyzer or seo)
cp server/api/seo/*.js server/api/[agent-name]/
```

**2. Update Webhook URL**
```javascript
// In server/api/[agent-name]/start.js
const response = await fetch('https://neulandai.app.n8n.cloud/webhook/[agent-webhook]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    [agent_specific_fields]: value,
    job_id: jobId,
    callback_url: callbackUrl
  })
});
```

**3. Frontend Migration**
```typescript
// Convert form submission to API call
const response = await fetch(`${API_BASE_URL}/api/[agent-name]/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ [form_data] })
});

const { job_id } = await response.json();
setJobId(job_id);
setStatus('sending');
```

### Testing Checklist

For each migrated agent:
- [ ] Backend endpoints respond correctly
- [ ] n8n webhook integration works
- [ ] Frontend polling mechanism functions
- [ ] Error handling covers all scenarios
- [ ] Loading states are consistent
- [ ] Result display matches expected format

## 🔧 Development Tools

### Useful Commands

**Test Backend Health:**
```bash
curl https://agent-store-backend.vercel.app/api/health
```

**Test Agent Status (before job exists):**
```bash
curl "https://agent-store-backend.vercel.app/api/[agent]/status?jobId=test"
# Should return 404 with proper error message
```

**Monitor Job Creation:**
```bash
# Check Vercel Function logs
vercel logs https://agent-store-backend.vercel.app
```

### Environment Variables Required

**Frontend (.env.local):**
```env
VITE_API_BASE_URL=https://agent-store-backend.vercel.app
```

**Backend (Vercel Dashboard):**
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## 📊 Quality Metrics

### Current Status
- **API-Based Agents**: 2/15 (13.3%)
- **Standardized Error Handling**: 2/15 (13.3%)
- **Job Persistence**: 2/15 (13.3%)
- **Consistent UI Patterns**: ~60% (needs improvement)

### Target Goals
- **API-Based Agents**: 15/15 (100%)
- **Standardized Error Handling**: 15/15 (100%)
- **Job Persistence**: 15/15 (100%)
- **Response Time**: <2s average
- **Error Rate**: <5%

## 🚀 Next Steps

1. **Complete Current Documentation** - Finish testing and scaling guides
2. **Migrate Research Agent** - First form-to-API migration as proof of concept
3. **Create Automated Testing** - Unit and integration tests for all agents
4. **Implement Monitoring** - Real-time agent performance tracking
5. **Scale Infrastructure** - Prepare for concurrent user load

---

*This document serves as the foundation for maintaining consistency and quality across all agents in the Agent Store ecosystem.*