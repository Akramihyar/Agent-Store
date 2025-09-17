// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for jobs (in production, use Redis or database)
const jobs = new Map();

// Generate job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start analysis endpoint - called by frontend
app.post('/api/landing-analyzer/start', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const jobId = generateJobId();
  
  // Store job info
  jobs.set(jobId, {
    id: jobId,
    url: url,
    status: 'pending',
    createdAt: new Date().toISOString(),
    fileUrl: null
  });
  
  // Send job to n8n with callback URL
  const callbackUrl = `${req.protocol}://${req.get('host')}/api/landing-analyzer/callback`;
  
  // Make request to n8n webhook
  fetch('https://neulandai.app.n8n.cloud/webhook/landing-analyzer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      website_url: url,
      job_id: jobId,
      callback_url: callbackUrl
    })
  })
  .then(response => {
    if (response.ok) {
      // Update job status
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'processing';
        jobs.set(jobId, job);
      }
      
      res.json({
        job_id: jobId,
        status: 'started',
        message: 'Analysis started successfully'
      });
    } else {
      // Failed to start
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = `Failed to start analysis: ${response.status}`;
        jobs.set(jobId, job);
      }
      
      res.status(500).json({
        error: 'Failed to start analysis'
      });
    }
  })
  .catch(error => {
    console.error('Error starting analysis:', error);
    
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      jobs.set(jobId, job);
    }
    
    res.status(500).json({
      error: 'Failed to start analysis'
    });
  });
});

// Callback endpoint - called by n8n when analysis is complete
app.post('/api/landing-analyzer/callback', (req, res) => {
  console.log('Received callback from n8n:', req.body);
  
  const { job_id, reply } = req.body;
  
  if (!job_id) {
    console.error('No job_id in callback');
    return res.status(400).json({ error: 'job_id is required' });
  }
  
  const job = jobs.get(job_id);
  if (!job) {
    console.error('Job not found:', job_id);
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Extract File_url from reply
  let fileUrl = null;
  if (reply && Array.isArray(reply) && reply[0]) {
    fileUrl = reply[0].File_url;
  }
  
  if (fileUrl) {
    job.status = 'completed';
    job.fileUrl = fileUrl;
    job.completedAt = new Date().toISOString();
  } else {
    job.status = 'failed';
    job.error = 'No File_url received in callback';
  }
  
  jobs.set(job_id, job);
  
  console.log('Updated job:', job);
  
  res.json({ success: true });
});

// Check job status - called by frontend
app.get('/api/landing-analyzer/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Get all jobs (for debugging)
app.get('/api/landing-analyzer/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values());
  res.json(allJobs);
});

// Generic agent endpoints for other agents
app.post('/api/:agentType/start', (req, res) => {
  const { agentType } = req.params;
  const { url, ...otherData } = req.body;
  
  const jobId = generateJobId();
  
  // Store job info
  jobs.set(jobId, {
    id: jobId,
    agentType: agentType,
    url: url || 'N/A',
    data: otherData,
    status: 'pending',
    createdAt: new Date().toISOString(),
    result: null
  });
  
  // Agent webhook URLs (add more as needed)
  const agentWebhooks = {
    'seo': 'https://neulandai.app.n8n.cloud/webhook/seo-audit-agent',
    'research': 'https://neulandai.app.n8n.cloud/webhook/research-agent',
    'leadgen': 'https://neulandai.app.n8n.cloud/webhook/lead-generator',
    'support': 'https://neulandai.app.n8n.cloud/webhook/support-agent',
    'landing-analyzer': 'https://neulandai.app.n8n.cloud/webhook/landing-analyzer'
  };
  
  const webhookUrl = agentWebhooks[agentType];
  if (!webhookUrl) {
    return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
  }
  
  const callbackUrl = `${req.protocol}://${req.get('host')}/api/${agentType}/callback`;
  
  // Send to n8n webhook
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...req.body,
      job_id: jobId,
      callback_url: callbackUrl
    })
  })
  .then(response => {
    const job = jobs.get(jobId);
    if (response.ok && job) {
      job.status = 'processing';
      jobs.set(jobId, job);
      res.json({ job_id: jobId, status: 'started', message: `${agentType} analysis started` });
    } else {
      if (job) {
        job.status = 'failed';
        job.error = `Failed to start ${agentType} analysis: ${response.status}`;
        jobs.set(jobId, job);
      }
      res.status(500).json({ error: `Failed to start ${agentType} analysis` });
    }
  })
  .catch(error => {
    console.error(`Error starting ${agentType} analysis:`, error);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      jobs.set(jobId, job);
    }
    res.status(500).json({ error: `Failed to start ${agentType} analysis` });
  });
});

// Generic callback endpoint
app.post('/api/:agentType/callback', (req, res) => {
  const { agentType } = req.params;
  console.log(`Received ${agentType} callback from n8n:`, req.body);
  
  const { job_id, reply, result, ...otherData } = req.body;
  
  if (!job_id) {
    console.error(`No job_id in ${agentType} callback`);
    return res.status(400).json({ error: 'job_id is required' });
  }
  
  const job = jobs.get(job_id);
  if (!job) {
    console.error(`${agentType} job not found:`, job_id);
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Store the complete response
  job.status = 'completed';
  job.result = req.body;
  job.completedAt = new Date().toISOString();
  
  jobs.set(job_id, job);
  console.log(`Updated ${agentType} job:`, job);
  
  res.json({ success: true });
});

// Generic status check
app.get('/api/:agentType/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cleanup old jobs (run every hour)
setInterval(() => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  for (const [jobId, job] of jobs) {
    const jobTime = new Date(job.createdAt).getTime();
    if (jobTime < oneDayAgo) {
      jobs.delete(jobId);
      console.log('Cleaned up old job:', jobId);
    }
  }
}, 60 * 60 * 1000); // 1 hour

app.listen(PORT, () => {
  console.log(`🚀 Agent Store Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Debug jobs: http://localhost:${PORT}/api/landing-analyzer/jobs`);
});