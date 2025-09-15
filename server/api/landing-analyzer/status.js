import { jobs } from '../../lib/jobs.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get jobId from query parameter
  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId query parameter is required' });
  }

  console.log('🔍 Looking for job:', jobId);
  console.log('📊 Total jobs in storage:', jobs.size);
  console.log('🗂️ Available job IDs:', Array.from(jobs.keys()));
  console.log('🔧 Job storage object:', Object.fromEntries(jobs));

  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      jobId: jobId,
      availableJobs: Array.from(jobs.keys())
    });
  }

  res.json(job);
}