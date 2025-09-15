// Simple in-memory job storage
// For serverless functions, we need to use a global variable that persists
if (!globalThis.jobStorage) {
  globalThis.jobStorage = new Map();
}

const jobs = globalThis.jobStorage;

// Generate job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Cleanup old jobs (older than 24 hours)
function cleanupOldJobs() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

  for (const [jobId, job] of jobs) {
    const jobTime = new Date(job.createdAt).getTime();
    if (jobTime < oneDayAgo) {
      jobs.delete(jobId);
      console.log('Cleaned up old job:', jobId);
    }
  }
}

export { jobs, generateJobId, cleanupOldJobs };