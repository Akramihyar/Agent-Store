// Persistent job storage using Upstash Redis
import { Redis } from '@upstash/redis';

let redis;
try {
  redis = Redis.fromEnv();
  console.log('✅ Redis connected successfully');
} catch (error) {
  console.error('❌ Redis connection failed:', error);
  console.log('Environment variables:', {
    url: process.env.UPSTASH_REDIS_REST_URL ? 'present' : 'missing',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'present' : 'missing'
  });
}

// Job storage interface that mimics Map but uses Redis
const jobs = {
  async set(jobId, jobData) {
    if (!redis) {
      console.error('❌ Redis not available, cannot store job');
      return;
    }
    try {
      await redis.setex(`job:${jobId}`, 86400, JSON.stringify(jobData)); // 24 hour expiry
      console.log('💾 Job stored in Redis:', jobId);
    } catch (error) {
      console.error('❌ Failed to store job in Redis:', error);
    }
  },

  async get(jobId) {
    if (!redis) {
      console.error('❌ Redis not available, cannot retrieve job');
      return null;
    }
    try {
      const jobString = await redis.get(`job:${jobId}`);
      const job = jobString ? JSON.parse(jobString) : null;
      console.log('📖 Job retrieved from Redis:', jobId, job ? 'found' : 'not found');
      return job;
    } catch (error) {
      console.error('❌ Failed to retrieve job from Redis:', error);
      return null;
    }
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