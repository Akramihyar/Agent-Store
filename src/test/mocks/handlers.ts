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
    await request.json(); // Read body to satisfy request
    return HttpResponse.json({
      job_id: 'test_job_123',
      status: 'started',
      message: 'Landing analysis started successfully'
    });
  }),

  // Landing analyzer status mock
  http.get('*/api/landing-analyzer/status', ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId === 'test_job_123') {
      return HttpResponse.json({
        id: jobId,
        url: 'https://example.com',
        status: 'completed',
        fileUrl: 'https://test-result.com/report.pdf',
        createdAt: '2025-09-15T12:00:00.000Z',
        completedAt: '2025-09-15T12:01:00.000Z'
      });
    }

    return HttpResponse.json(
      { error: 'Job not found', jobId },
      { status: 404 }
    );
  }),

  // SEO analyzer start mock
  http.post('*/api/seo/start', async ({ request }) => {
    await request.json(); // Read body to satisfy request
    return HttpResponse.json({
      job_id: 'test_seo_job_456',
      status: 'started',
      message: 'SEO analysis started successfully'
    });
  }),

  // SEO analyzer status mock
  http.get('*/api/seo/status', ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId === 'test_seo_job_456') {
      return HttpResponse.json({
        id: jobId,
        status: 'completed',
        result: {
          reply: [{ File_url: 'https://test-seo-result.com/report.pdf' }]
        },
        createdAt: '2025-09-15T12:00:00.000Z',
        completedAt: '2025-09-15T12:02:00.000Z'
      });
    }

    return HttpResponse.json(
      { error: 'Job not found', jobId },
      { status: 404 }
    );
  }),

  // Website Intelligence start mock
  http.post('*/api/website-intelligence/start', async ({ request }) => {
    await request.json(); // Read body to satisfy request
    return HttpResponse.json({
      job_id: 'test_website_job_789',
      status: 'started',
      message: 'Website intelligence analysis started successfully'
    });
  }),

  // Website Intelligence status mock
  http.get('*/api/website-intelligence/status', ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId === 'test_website_job_789') {
      return HttpResponse.json({
        id: jobId,
        company_name: 'Example Company',
        website_url: 'https://example.com',
        number_documents: 5,
        status: 'completed',
        fileUrl: 'https://test-website-result.com/files.zip',
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