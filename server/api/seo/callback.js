import { jobs } from '../../lib/jobs.js';

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

  console.log('Received SEO callback from n8n:', req.body);

  const { job_id, reply, result } = req.body;

  if (!job_id) {
    console.error('No job_id in SEO callback');
    return res.status(400).json({ error: 'job_id is required' });
  }

  const job = jobs.get(job_id);
  if (!job) {
    console.error('SEO job not found:', job_id);
    return res.status(404).json({ error: 'Job not found' });
  }

  // Store the complete response
  job.status = 'completed';
  job.result = req.body;
  job.completedAt = new Date().toISOString();

  jobs.set(job_id, job);
  console.log('Updated SEO job:', job);

  res.json({ success: true });
}