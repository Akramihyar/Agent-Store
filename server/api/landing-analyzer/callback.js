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

  console.log('Received callback from n8n:', req.body);

  const { job_id, reply } = req.body;

  if (!job_id) {
    console.error('No job_id in callback');
    return res.status(400).json({ error: 'job_id is required' });
  }

  const job = await jobs.get(job_id);
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

  await jobs.set(job_id, job);

  console.log('Updated job:', job);

  res.json({ success: true });
}