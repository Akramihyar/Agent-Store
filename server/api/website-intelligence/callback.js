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

  console.log('Received Website Intelligence callback from n8n:', req.body);

  const { job_id, reply, result } = req.body;

  if (!job_id) {
    console.error('No job_id in Website Intelligence callback');
    return res.status(400).json({ error: 'job_id is required' });
  }

  const job = await jobs.get(job_id);
  if (!job) {
    console.error('Website Intelligence job not found:', job_id);
    return res.status(404).json({ error: 'Job not found' });
  }

  // Store the complete response
  job.status = 'completed';
  job.result = req.body;
  job.completedAt = new Date().toISOString();

  // Extract file URL from the reply for easier frontend access
  if (reply && Array.isArray(reply) && reply[0] && reply[0].File_url) {
    job.fileUrl = reply[0].File_url;
  }

  await jobs.set(job_id, job);
  console.log('Updated Website Intelligence job:', job);

  res.json({ success: true });
}