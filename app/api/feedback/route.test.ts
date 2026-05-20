import { POST } from './route';

describe('Feedback API POST handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 200 and success for valid telemetry payload', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ type: 'test', solutionLength: 10 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should handle incomplete (but parsable) data gracefully', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should return 400 for malformed JSON payload', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: 'invalid-json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid JSON' });
  });
});
