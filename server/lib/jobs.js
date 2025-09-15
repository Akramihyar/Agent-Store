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
      // Ensure we have a proper object to serialize
      const dataToStore = typeof jobData === 'object' ? jobData : { data: jobData };
      const jsonString = JSON.stringify(dataToStore);

      console.log('💾 Storing job in Redis:', jobId, 'Data:', jsonString);
      await redis.setex(`job:${jobId}`, 86400, jsonString); // 24 hour expiry
      console.log('✅ Job stored successfully in Redis:', jobId);
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
      console.log('📖 Raw data from Redis for', jobId, ':', jobString);

      if (!jobString) {
        console.log('📖 No job found in Redis for:', jobId);
        return null;
      }

      // Handle case where Redis returned an object instead of string
      if (typeof jobString === 'object') {
        console.log('📖 Redis returned object directly:', jobString);
        return jobString;
      }

      const job = JSON.parse(jobString);
      console.log('📖 Job parsed from Redis:', jobId, 'found');
      return job;
    } catch (error) {
      console.error('❌ Failed to retrieve job from Redis:', error);
      console.error('❌ Raw value that failed to parse:', await redis.get(`job:${jobId}`));
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