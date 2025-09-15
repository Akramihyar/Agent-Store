// Simple in-memory job storage
// In production, use Redis or a database
const jobs = new Map();

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

// Run cleanup periodically
setInterval(cleanupOldJobs, 60 * 60 * 1000); // 1 hour

module.exports = {
  jobs,
  generateJobId,
  cleanupOldJobs
};