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

  const { company_name, website_url, number_documents } = req.body;

  if (!company_name || !website_url) {
    return res.status(400).json({ error: 'Company name and website URL are required' });
  }

  const jobId = generateJobId();

  // Store job info
  const newJob = {
    id: jobId,
    company_name: company_name,
    website_url: website_url,
    number_documents: number_documents || 5,
    status: 'pending',
    createdAt: new Date().toISOString(),
    result: null
  };

  await jobs.set(jobId, newJob);
  console.log('✅ Website Intelligence Job created:', jobId);
  console.log('🗂️ Job details:', newJob);

  // Send job to n8n with callback URL
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const callbackUrl = `${protocol}://${host}/api/website-intelligence/callback`;

  try {
    // Make request to n8n webhook
    const response = await fetch('https://neulandai.app.n8n.cloud/webhook/website-Intelligence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: company_name,
        website_url: website_url,
        number_documents: number_documents || 5,
        job_id: jobId,
        callback_url: callbackUrl
      })
    });

    if (response.ok) {
      // Update job status
      const job = await jobs.get(jobId);
      if (job) {
        job.status = 'processing';
        await jobs.set(jobId, job);
      }

      res.json({
        job_id: jobId,
        status: 'started',
        message: 'Website intelligence analysis started successfully'
      });
    } else {
      // Failed to start
      const job = await jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = `Failed to start website intelligence analysis: ${response.status}`;
        await jobs.set(jobId, job);
      }

      res.status(500).json({
        error: 'Failed to start website intelligence analysis'
      });
    }
  } catch (error) {
    console.error('Error starting website intelligence analysis:', error);

    const job = await jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      await jobs.set(jobId, job);
    }

    res.status(500).json({
      error: 'Failed to start website intelligence analysis'
    });
  }
}