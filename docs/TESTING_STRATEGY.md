# Agent Store - Testing Strategy

## 🎯 Testing Overview

This document outlines the comprehensive testing strategy for the Agent Store platform, including unit tests, integration tests, and stress testing for concurrent user scenarios.

## 🧪 Testing Architecture

### Testing Pyramid Structure

```
                    🔺 E2E Tests (5%)
                  🔸🔸🔸 Integration Tests (25%)
              🔹🔹🔹🔹🔹🔹🔹 Unit Tests (70%)
```

**Unit Tests (70%):** Individual functions, components, utilities
**Integration Tests (25%):** API endpoints, agent workflows, database operations
**E2E Tests (5%):** Complete user journeys, critical business flows

## 📋 Current Testing Status

### ❌ Missing Test Coverage
- **Unit Tests**: 0% coverage
- **Integration Tests**: Manual testing only
- **E2E Tests**: None implemented
- **Load Testing**: Not implemented
- **Monitoring**: Basic health checks only

### ✅ Existing Quality Measures
- Production deployment working
- Manual testing for core agents
- Basic error handling
- Health check endpoints

## 🛠️ Unit Testing Implementation

### Test Framework Setup

**Install Dependencies:**
```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  msw
```

**Vitest Configuration (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

**Test Setup (`src/test/setup.ts`):**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Mock server for API calls
const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### Mock Service Worker Setup

**API Mocks (`src/test/mocks/handlers.ts`):**
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Health check mock
  http.get('*/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Agent Store Backend API'
    });
  }),

  // Landing analyzer start mock
  http.post('*/api/landing-analyzer/start', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      job_id: 'test_job_123',
      status: 'started',
      message: 'Landing analysis started successfully'
    });
  }),

  // Status check mock
  http.get('*/api/landing-analyzer/status', ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId === 'test_job_123') {
      return HttpResponse.json({
        id: jobId,
        status: 'completed',
        result: {
          reply: [{ File_url: 'https://test-result.com/report.pdf' }]
        },
        createdAt: '2025-09-15T12:00:00.000Z',
        completedAt: '2025-09-15T12:01:00.000Z'
      });
    }

    return HttpResponse.json(
      { error: 'Job not found', jobId },
      { status: 404 }
    );
  }),

  // n8n webhook mocks
  http.post('https://neulandai.app.n8n.cloud/webhook/*', () => {
    return HttpResponse.json({ success: true });
  }),
];
```

### Component Unit Tests

**Example: Landing Analyzer Form Test (`src/pages/__tests__/LandingAnalyzerForm.test.tsx`):**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingAnalyzerForm from '../LandingAnalyzerForm';

// Mock environment variable
vi.mock('import.meta.env', () => ({
  VITE_API_BASE_URL: 'http://test-api.com'
}));

describe('LandingAnalyzerForm', () => {
  const defaultProps = {
    badgeLabel: 'Test Analyzer',
    agentId: 'landing'
  };

  it('renders form with required fields', () => {
    render(<LandingAnalyzerForm {...defaultProps} />);

    expect(screen.getByText('Test Analyzer')).toBeInTheDocument();
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('validates required URL field', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /analyze/i });
    await user.click(submitButton);

    // Should not submit without URL
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('submits form and shows loading state', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('loading-dog')).toBeInTheDocument();
    });
  });

  it('displays result when analysis completes', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/view analysis result/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

**Utility Function Tests (`src/lib/__tests__/utils.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
import { cn, validateUrl, formatTimestamp } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('combines class names correctly', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
      expect(cn('btn', false && 'hidden', 'active')).toBe('btn active');
    });
  });

  describe('validateUrl', () => {
    it('validates correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://test.com')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('formatTimestamp', () => {
    it('formats timestamps correctly', () => {
      const timestamp = '2025-09-15T12:00:00.000Z';
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // HH:MM format
    });
  });
});
```

## 🔗 Integration Testing

### Backend API Tests

**Test Setup (`server/test/setup.js`):**
```javascript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { Redis } from '@upstash/redis';

// Mock Redis for testing
const mockRedis = {
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
};

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => mockRedis
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
});
```

**API Endpoint Tests (`server/api/__tests__/landing-analyzer.test.js`):**
```javascript
import { describe, it, expect, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import startHandler from '../landing-analyzer/start.js';
import callbackHandler from '../landing-analyzer/callback.js';
import statusHandler from '../landing-analyzer/status.js';

describe('Landing Analyzer API', () => {
  describe('POST /api/landing-analyzer/start', () => {
    it('creates job and returns job_id', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { url: 'https://example.com' },
      });

      // Mock fetch for n8n call
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await startHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('job_id');
      expect(data.status).toBe('started');
    });

    it('validates required URL field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await startHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('URL is required');
    });
  });

  describe('POST /api/landing-analyzer/callback', () => {
    it('updates job with n8n results', async () => {
      const jobId = 'test_job_123';
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          job_id: jobId,
          reply: [{ File_url: 'https://result.com/report.pdf' }]
        },
      });

      // Mock existing job
      const mockJob = { id: jobId, status: 'processing' };
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(mockJob));

      await callbackHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `job:${jobId}`,
        86400,
        expect.stringContaining('"status":"completed"')
      );
    });
  });

  describe('GET /api/landing-analyzer/status', () => {
    it('returns job status', async () => {
      const jobId = 'test_job_123';
      const { req, res } = createMocks({
        method: 'GET',
        query: { jobId },
      });

      const mockJob = { id: jobId, status: 'completed' };
      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(mockJob));

      await statusHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.id).toBe(jobId);
      expect(data.status).toBe('completed');
    });

    it('returns 404 for non-existent job', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { jobId: 'nonexistent' },
      });

      vi.mocked(mockRedis.get).mockResolvedValue(null);

      await statusHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });
});
```

## 🚀 E2E Testing with Playwright

**Install Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Playwright Config (`playwright.config.ts`):**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Example (`e2e/landing-analyzer.spec.ts`):**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Analyzer Agent', () => {
  test('complete analysis workflow', async ({ page }) => {
    // Navigate to landing analyzer
    await page.goto('/');
    await page.click('[data-testid="landing-analyzer-card"]');

    // Fill form
    await page.fill('[data-testid="url-input"]', 'https://example.com');
    await page.click('[data-testid="analyze-button"]');

    // Wait for loading state
    await expect(page.locator('[data-testid="loading-dog"]')).toBeVisible();

    // Wait for results (with longer timeout for real processing)
    await expect(page.locator('[data-testid="result-link"]')).toBeVisible({
      timeout: 30000
    });

    // Verify result link is clickable
    const resultLink = page.locator('[data-testid="result-link"]');
    await expect(resultLink).toHaveAttribute('href', /.+/);
  });

  test('handles invalid URL gracefully', async ({ page }) => {
    await page.goto('/landing');

    await page.fill('[data-testid="url-input"]', 'not-a-url');
    await page.click('[data-testid="analyze-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

## ⚡ Stress Testing & Load Testing

### Artillery.js Setup

**Install Artillery:**
```bash
npm install --save-dev artillery
```

**Load Test Configuration (`artillery-config.yml`):**
```yaml
config:
  target: 'https://agent-store-backend.vercel.app'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 1
      name: "Warm up"

    # Ramp up phase
    - duration: 300
      arrivalRate: 1
      rampTo: 10
      name: "Ramp up load"

    # Sustained load
    - duration: 600
      arrivalRate: 10
      name: "Sustained load"

    # Stress test
    - duration: 300
      arrivalRate: 10
      rampTo: 50
      name: "Stress test"

  payload:
    - path: './test-urls.csv'
      fields:
        - url

scenarios:
  - name: "Landing Analyzer Load Test"
    weight: 70
    flow:
      - post:
          url: "/api/landing-analyzer/start"
          json:
            url: "{{ url }}"
          capture:
            - json: "$.job_id"
              as: "jobId"

      - loop:
          - get:
              url: "/api/landing-analyzer/status?jobId={{ jobId }}"
              capture:
                - json: "$.status"
                  as: "status"
          - think: 2
        while: "{{ status !== 'completed' && status !== 'failed' }}"
        count: 30

  - name: "SEO Audit Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/seo/start"
          json:
            url: "{{ url }}"
          capture:
            - json: "$.job_id"
              as: "jobId"

      - loop:
          - get:
              url: "/api/seo/status?jobId={{ jobId }}"
          - think: 2
        count: 30
```

**Test Data (`test-urls.csv`):**
```csv
url
https://example.com
https://google.com
https://github.com
https://stackoverflow.com
https://medium.com
https://techcrunch.com
https://vercel.com
https://anthropic.com
```

**Run Load Tests:**
```bash
# Basic load test
npx artillery run artillery-config.yml

# Extended stress test
npx artillery run artillery-config.yml --output report.json
npx artillery report report.json
```

### Concurrent User Testing

**Custom Stress Test Script (`scripts/stress-test.js`):**
```javascript
import { Worker } from 'worker_threads';
import fs from 'fs';

const API_BASE_URL = 'https://agent-store-backend.vercel.app';
const CONCURRENT_USERS = 50;
const TEST_DURATION = 300; // seconds

async function simulateUser(userId) {
  const results = [];
  const startTime = Date.now();

  while ((Date.now() - startTime) < TEST_DURATION * 1000) {
    try {
      // Start job
      const startResponse = await fetch(`${API_BASE_URL}/api/landing-analyzer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });

      const { job_id } = await startResponse.json();
      const jobStartTime = Date.now();

      // Poll for completion
      let status = 'pending';
      while (status === 'pending' || status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${API_BASE_URL}/api/landing-analyzer/status?jobId=${job_id}`
        );
        const data = await statusResponse.json();
        status = data.status;

        // Timeout after 2 minutes
        if (Date.now() - jobStartTime > 120000) {
          status = 'timeout';
          break;
        }
      }

      results.push({
        userId,
        jobId: job_id,
        status,
        duration: Date.now() - jobStartTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      results.push({
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

async function runStressTest() {
  console.log(`Starting stress test with ${CONCURRENT_USERS} concurrent users...`);

  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(simulateUser(i));
  }

  const allResults = await Promise.all(promises);
  const flatResults = allResults.flat();

  // Analyze results
  const successful = flatResults.filter(r => r.status === 'completed').length;
  const failed = flatResults.filter(r => r.status === 'failed').length;
  const timeouts = flatResults.filter(r => r.status === 'timeout').length;
  const errors = flatResults.filter(r => r.error).length;

  const durations = flatResults
    .filter(r => r.duration && r.status === 'completed')
    .map(r => r.duration);

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  const report = {
    testConfig: {
      concurrentUsers: CONCURRENT_USERS,
      duration: TEST_DURATION,
      timestamp: new Date().toISOString()
    },
    results: {
      total: flatResults.length,
      successful,
      failed,
      timeouts,
      errors,
      successRate: (successful / flatResults.length * 100).toFixed(2) + '%'
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
  fs.writeFileSync(
    `stress-test-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log('Stress Test Results:');
  console.log(`Total requests: ${report.results.total}`);
  console.log(`Success rate: ${report.results.successRate}`);
  console.log(`Average duration: ${report.performance.avgDuration}ms`);
  console.log(`Max duration: ${report.performance.maxDuration}ms`);
}

runStressTest().catch(console.error);
```

## 📊 Test Execution & CI/CD

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:load": "artillery run artillery-config.yml",
    "test:stress": "node scripts/stress-test.js",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e"
  }
}
```

### GitHub Actions Workflow (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    environment: testing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:integration
        env:
          UPSTASH_REDIS_REST_URL: ${{ secrets.TEST_REDIS_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.TEST_REDIS_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  load-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm install -g artillery
      - run: npm run test:load
```

## 🎯 Success Metrics & Targets

### Performance Targets
- **Response Time**: <2s average for API endpoints
- **Success Rate**: >95% for all agent workflows
- **Concurrent Users**: Support 100+ simultaneous users
- **Error Rate**: <5% under normal load
- **Uptime**: >99.5% availability

### Test Coverage Goals
- **Unit Tests**: >80% code coverage
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user journey coverage
- **Load Tests**: Automated testing up to 50 concurrent users

### Monitoring & Alerting
- Real-time error rate monitoring
- Performance regression detection
- Automated failure notifications
- Daily test execution reports

---

*This testing strategy ensures the Agent Store platform remains reliable, performant, and scalable as it grows.*