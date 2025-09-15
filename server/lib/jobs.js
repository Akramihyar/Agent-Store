// Persistent job storage using Upstash Redis
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Job storage interface that mimics Map but uses Redis
const jobs = {
  async set(jobId, jobData) {
    await redis.setex(`job:${jobId}`, 86400, JSON.stringify(jobData)); // 24 hour expiry
    console.log('💾 Job stored in Redis:', jobId);
  },

  async get(jobId) {
    const jobString = await redis.get(`job:${jobId}`);
    const job = jobString ? JSON.parse(jobString) : null;
    console.log('📖 Job retrieved from Redis:', jobId, job ? 'found' : 'not found');
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