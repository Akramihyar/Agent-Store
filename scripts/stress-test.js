#!/usr/bin/env node

const API_BASE_URL = 'https://agent-store-backend.vercel.app';
const CONCURRENT_USERS = 25; // Start with smaller number for safety
const TEST_DURATION = 180; // 3 minutes
const TEST_URLS = [
  'https://example.com',
  'https://google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://vercel.com'
];

async function simulateUser(userId) {
  const results = [];
  const startTime = Date.now();
  const testUrl = TEST_URLS[userId % TEST_URLS.length];

  console.log(`👤 User ${userId} starting with URL: ${testUrl}`);

  while ((Date.now() - startTime) < TEST_DURATION * 1000) {
    try {
      // Start job
      const startResponse = await fetch(`${API_BASE_URL}/api/landing-analyzer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl })
      });

      if (!startResponse.ok) {
        throw new Error(`Start failed: ${startResponse.status}`);
      }

      const { job_id } = await startResponse.json();
      const jobStartTime = Date.now();

      console.log(`🚀 User ${userId} started job: ${job_id}`);

      // Poll for completion
      let status = 'pending';
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      while ((status === 'pending' || status === 'processing') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${API_BASE_URL}/api/landing-analyzer/status?jobId=${job_id}`
        );

        if (statusResponse.ok) {
          const data = await statusResponse.json();
          status = data.status;
          attempts++;
        } else {
          status = 'failed';
          break;
        }
      }

      if (attempts >= maxAttempts) {
        status = 'timeout';
      }

      const duration = Date.now() - jobStartTime;

      results.push({
        userId,
        jobId: job_id,
        url: testUrl,
        status,
        duration,
        attempts,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ User ${userId} job ${job_id}: ${status} (${duration}ms, ${attempts} attempts)`);

      // Wait between requests to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      results.push({
        userId,
        url: testUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.log(`❌ User ${userId} error: ${error.message}`);

      // Wait on error before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`🏁 User ${userId} finished with ${results.length} requests`);
  return results;
}

async function runStressTest() {
  console.log(`🔥 Starting stress test with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION}s...`);
  console.log(`🎯 Target: ${API_BASE_URL}`);
  console.log(`📊 Test URLs: ${TEST_URLS.length} different URLs`);
  console.log('⏱️  Starting in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(simulateUser(i));
  }

  const startTime = Date.now();
  const allResults = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const flatResults = allResults.flat();

  // Analyze results
  const successful = flatResults.filter(r => r.status === 'completed').length;
  const failed = flatResults.filter(r => r.status === 'failed').length;
  const timeouts = flatResults.filter(r => r.status === 'timeout').length;
  const errors = flatResults.filter(r => r.error).length;

  const durations = flatResults
    .filter(r => r.duration && r.status === 'completed')
    .map(r => r.duration);

  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

  const report = {
    testConfig: {
      concurrentUsers: CONCURRENT_USERS,
      duration: TEST_DURATION,
      actualDuration: Math.round(totalTime / 1000),
      timestamp: new Date().toISOString(),
      targetUrl: API_BASE_URL
    },
    results: {
      total: flatResults.length,
      successful,
      failed,
      timeouts,
      errors,
      successRate: flatResults.length > 0 ? (successful / flatResults.length * 100).toFixed(2) + '%' : '0%',
      requestsPerSecond: (flatResults.length / (totalTime / 1000)).toFixed(2)
    },
    performance: {
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      unit: 'milliseconds'
    },
    rawData: flatResults
  };

  // Save report
  const fs = await import('fs');
  const reportFile = `stress-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log('\n🎯 STRESS TEST RESULTS:');
  console.log('═══════════════════════');
  console.log(`📊 Total requests: ${report.results.total}`);
  console.log(`✅ Success rate: ${report.results.successRate}`);
  console.log(`⚡ Requests/second: ${report.results.requestsPerSecond}`);
  console.log(`⏱️  Average duration: ${report.performance.avgDuration}ms`);
  console.log(`🐌 Max duration: ${report.performance.maxDuration}ms`);
  console.log(`🚀 Min duration: ${report.performance.minDuration}ms`);
  console.log(`❌ Failed: ${report.results.failed}`);
  console.log(`⏰ Timeouts: ${report.results.timeouts}`);
  console.log(`💥 Errors: ${report.results.errors}`);
  console.log(`\n📁 Report saved: ${reportFile}`);

  // Performance recommendations
  console.log('\n🔧 RECOMMENDATIONS:');
  if (report.results.successRate < 90) {
    console.log('⚠️  Success rate below 90% - consider scaling backend resources');
  }
  if (report.performance.avgDuration > 30000) {
    console.log('⚠️  Average response time > 30s - optimize processing pipeline');
  }
  if (report.results.timeouts > 0) {
    console.log('⚠️  Timeouts detected - increase timeout limits or optimize performance');
  }
  if (parseFloat(report.results.requestsPerSecond) < 1) {
    console.log('⚠️  Low throughput - consider horizontal scaling');
  }

  console.log('\n🎉 Stress test completed!');
}

runStressTest().catch(console.error);