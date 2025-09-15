import { jobs, generateJobId } from '../../lib/jobs.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const jobId = generateJobId();

  // Store job info
  const newJob = {
    id: jobId,
    url: url,
    status: 'pending',
    createdAt: new Date().toISOString(),
    fileUrl: null
  };

  jobs.set(jobId, newJob);
  console.log('✅ Job created:', jobId);
  console.log('📊 Total jobs in storage:', jobs.size);
  console.log('🗂️ Job details:', newJob);

  // Send job to n8n with callback URL
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const callbackUrl = `${protocol}://${host}/api/landing-analyzer/callback`;

  try {
    // Make request to n8n webhook
    const response = await fetch('https://neulandai.app.n8n.cloud/webhook/landing-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website_url: url,
        job_id: jobId,
        callback_url: callbackUrl
      })
    });

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
  } catch (error) {
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
  }
}