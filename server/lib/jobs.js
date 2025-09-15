// Persistent job storage using Vercel KV
import { kv } from '@vercel/kv';

// Job storage interface that mimics Map but uses KV
const jobs = {
  async set(jobId, jobData) {
    await kv.set(`job:${jobId}`, jobData, { ex: 86400 }); // 24 hour expiry
    console.log('💾 Job stored in KV:', jobId);
  },

  async get(jobId) {
    const job = await kv.get(`job:${jobId}`);
    console.log('📖 Job retrieved from KV:', jobId, job ? 'found' : 'not found');
    return job;
  },

  async keys() {
    // This is a simplified implementation - in production you'd want better key management
    return [];
  },

  async size() {
    // Simplified - would need separate counter in production
    return 0;
  }
};

// Generate job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Cleanup old jobs (automatic with TTL in KV)
function cleanupOldJobs() {
  // Jobs automatically expire after 24 hours with KV TTL
  console.log('Jobs auto-cleanup with KV TTL');
}

export { jobs, generateJobId, cleanupOldJobs };