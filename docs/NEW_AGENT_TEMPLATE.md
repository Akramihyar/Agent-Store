# New Agent Development Template

This template provides a step-by-step guide for adding new agents to the Agent Store platform.

## 🎯 Quick Start Checklist

- [ ] Choose agent type (API-based recommended)
- [ ] Set up n8n workflow with webhook
- [ ] Create backend API endpoints
- [ ] Implement frontend form component
- [ ] Register agent in system
- [ ] Test integration end-to-end
- [ ] Deploy and monitor

## 📋 Prerequisites

**Required Accounts:**
- Vercel account (for deployment)
- Upstash Redis access (for job storage)
- n8n cloud access (for workflow hosting)

**Development Setup:**
- Node.js 20.x
- Git repository access
- Local development environment

## 🛠️ Step-by-Step Implementation

### Step 1: Plan Your Agent

**Define Agent Specifications:**
```markdown
Agent Name: [Your Agent Name]
Description: [What does this agent do?]
Input Fields: [List form fields needed]
Output Format: [File/URL/Text/JSON]
Processing Time: [Estimated duration]
n8n Workflow: [Webhook endpoint needed]
```

**Example:**
```markdown
Agent Name: Content Analyzer
Description: Analyzes website content for readability and SEO
Input Fields: website_url, analysis_depth
Output Format: PDF report URL
Processing Time: 30-60 seconds
n8n Workflow: content-analyzer-webhook
```

### Step 2: Create n8n Workflow

**Setup n8n Webhook:**
1. Create new workflow in n8n cloud
2. Add Webhook trigger node
3. Configure webhook URL: `https://neulandai.app.n8n.cloud/webhook/[agent-name]`
4. Add your processing logic (AI calls, data processing, etc.)
5. Add HTTP Request node for callback
6. Test workflow with sample data

**Callback Configuration:**
```json
{
  "method": "POST",
  "url": "{{$parameter['callback_url']}}",
  "body": {
    "job_id": "{{$parameter['job_id']}}",
    "reply": [
      {
        "File_url": "{{$node['ProcessingNode'].json['result_url']}}",
        "title": "{{$parameter['agent_name']}} Result",
        "status": "completed"
      }
    ]
  }
}
```

### Step 3: Create Backend API Endpoints

**Create Directory Structure:**
```bash
mkdir server/api/[agent-name]
cd server/api/[agent-name]
```

**1. Create `start.js`:**
```javascript
import { jobs, generateJobId } from '../../lib/jobs.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract form data
  const { /* your_form_fields */ } = req.body;

  // Validate required fields
  if (!/* required_field */) {
    return res.status(400).json({ error: 'Required field missing' });
  }

  const jobId = generateJobId();

  // Store job info
  const newJob = {
    id: jobId,
    /* your_data_fields */,
    status: 'pending',
    createdAt: new Date().toISOString(),
    result: null
  };

  await jobs.set(jobId, newJob);
  console.log('✅ Job created:', jobId);

  // Send to n8n
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const callbackUrl = `${protocol}://${host}/api/[agent-name]/callback`;

  try {
    const response = await fetch('https://neulandai.app.n8n.cloud/webhook/[agent-name]', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        /* your_payload_fields */,
        job_id: jobId,
        callback_url: callbackUrl
      })
    });

    if (response.ok) {
      const job = await jobs.get(jobId);
      if (job) {
        job.status = 'processing';
        await jobs.set(jobId, job);
      }

      res.json({
        job_id: jobId,
        status: 'started',
        message: '[Agent] started successfully'
      });
    } else {
      const job = await jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = `Failed to start: ${response.status}`;
        await jobs.set(jobId, job);
      }

      res.status(500).json({ error: 'Failed to start [agent]' });
    }
  } catch (error) {
    console.error('Error starting [agent]:', error);

    const job = await jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      await jobs.set(jobId, job);
    }

    res.status(500).json({ error: 'Failed to start [agent]' });
  }
}
```

**2. Create `callback.js`:**
```javascript
import { jobs } from '../../lib/jobs.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received [agent] callback from n8n:', req.body);

  const { job_id, reply, result } = req.body;

  if (!job_id) {
    console.error('No job_id in [agent] callback');
    return res.status(400).json({ error: 'job_id is required' });
  }

  const job = await jobs.get(job_id);
  if (!job) {
    console.error('[Agent] job not found:', job_id);
    return res.status(404).json({ error: 'Job not found' });
  }

  // Store the complete response
  job.status = 'completed';
  job.result = req.body;
  job.completedAt = new Date().toISOString();

  await jobs.set(job_id, job);
  console.log('Updated [agent] job:', job);

  res.json({ success: true });
}
```

**3. Create `status.js`:**
```javascript
import { jobs } from '../../lib/jobs.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId query parameter is required' });
  }

  console.log('🔍 Looking for [agent] job:', jobId);

  const job = await jobs.get(jobId);
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId: jobId
    });
  }

  res.json(job);
}
```

### Step 4: Create Frontend Form Component

**Create `src/pages/[AgentName]Form.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { ChatIcon, SettingsIcon } from '../components/icons';
import LoadingDog from '../components/LoadingDog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function [AgentName]Form({ badgeLabel, agentId }: { badgeLabel: string; agentId: string }) {
  // Form state
  const [/* formField */, set/* FormField */] = useState('');

  // Status management
  const [status, setStatus] = useState<'idle' | 'sending' | 'completed' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Polling for job status
  useEffect(() => {
    if (!jobId || status !== 'sending') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/[agent-name]/status?jobId=${jobId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setResult(data.result);
          setStatus('completed');
        } else if (data.status === 'failed') {
          setErrorMsg(data.error || '[Agent] failed');
          setStatus('error');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [jobId, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setStatus('sending');
      setErrorMsg(null);
      setResult(null);

      const response = await fetch(`${API_BASE_URL}/api/[agent-name]/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          /* your_form_data */
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setJobId(data.job_id);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Failed to start [agent]');
    }
  }

  // Extract result URL for display
  const getResultUrl = () => {
    if (!result?.reply?.[0]) return null;
    return result.reply[0].File_url || result.reply[0].url || null;
  };

  return (
    <main className="relative w-full h-full overflow-hidden bg-background rounded-xl">
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between w-full gap-5 p-3 border-b h-[60px]">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded-full flex gap-2 items-center text-xs leading-none border bg-rose-50 border-rose-100">
              <ChatIcon size={16} />
              <span>{badgeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground">
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            {/* Your form fields here */}
            <div>
              <label className="block text-sm font-medium mb-1">[Field Label]</label>
              <input
                value={/* formField */}
                onChange={(e) => set/* FormField */(e.target.value)}
                placeholder="[placeholder]"
                className="w-full border rounded-md px-3 py-2 bg-card"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={status === 'sending'}
            >
              Start [Agent]
            </button>

            {status === 'sending' && <LoadingDog />}
            {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
          </form>

          {status === 'completed' && result && (
            <div className="bg-accent text-accent-foreground px-3 py-2 rounded-xl">
              {getResultUrl() ? (
                <div>
                  ✅ <a href={getResultUrl()} target="_blank" rel="noopener noreferrer" className="underline">
                    View [Agent] Result
                  </a>
                </div>
              ) : (
                <div>✅ [Agent] completed successfully</div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

### Step 5: Register Agent in System

**1. Add to `src/agents/registry.ts`:**
```typescript
const [AGENT_NAME]_WEBHOOK = 'https://neulandai.app.n8n.cloud/webhook/[agent-name]';

// Add to agents array:
{
  id: '[agent-id]',
  name: '[Agent Display Name]',
  description: '[Agent description]',
  icon: 'generic',
  endpoint: { type: 'webhook', url: [AGENT_NAME]_WEBHOOK, method: 'POST' },
}
```

**2. Add to `src/data/assistants.json`:**
```json
{
  "id": "[agent-id]",
  "name": "[Agent Display Name]",
  "description": "[Agent description]",
  "category": "[category]",
  "tags": ["tag1", "tag2"],
  "rating": 4.5,
  "usage": "1.2k",
  "icon": "generic"
}
```

**3. Add route in `src/App.tsx`:**
```typescript
import [AgentName]Form from './pages/[AgentName]Form';

// Add route:
<Route path="/[agent-id]" element={<[AgentName]Form badgeLabel="[Agent Name]" agentId="[agent-id]" />} />
```

### Step 6: Testing Checklist

**Backend Testing:**
- [ ] Health check: `curl https://your-backend.vercel.app/api/health`
- [ ] Status endpoint: `curl "https://your-backend.vercel.app/api/[agent]/status?jobId=test"`
- [ ] Start endpoint: Test with Postman/curl
- [ ] Callback endpoint: Verify n8n can reach it

**Frontend Testing:**
- [ ] Form renders correctly
- [ ] Form validation works
- [ ] Loading state displays
- [ ] Polling mechanism functions
- [ ] Results display properly
- [ ] Error handling works

**Integration Testing:**
- [ ] End-to-end flow works
- [ ] n8n workflow triggers correctly
- [ ] Callback updates job status
- [ ] Frontend receives results
- [ ] File URLs/outputs are accessible

## 🚀 Deployment

**1. Deploy to Vercel:**
```bash
git add .
git commit -m "Add [agent-name] agent"
git push origin main
```

**2. Verify Deployment:**
- Frontend deploys automatically
- Backend functions are created
- Environment variables are set
- Redis connection works

**3. Test Production:**
- Submit test job through UI
- Monitor Vercel function logs
- Verify n8n workflow executes
- Confirm results are returned

## 📊 Monitoring

**Key Metrics to Track:**
- Job success rate
- Average processing time
- Error rate and types
- User engagement

**Monitoring Commands:**
```bash
# View function logs
vercel logs https://your-backend.vercel.app

# Check Redis usage
# Use Upstash dashboard

# Monitor job status
curl "https://your-backend.vercel.app/api/[agent]/status?jobId=[test-job-id]"
```

---

*Use this template as your starting point for any new agent development. Customize the form fields, processing logic, and output format based on your specific agent requirements.*