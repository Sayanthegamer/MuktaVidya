import { POST } from './route';

// Mock process.env for testing allowed origins
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, NODE_ENV: 'development' };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('POST /api/feedback', () => {
  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: 'invalid-json',
    });
    // Ensure no origin header so it passes dev mode check
    request.headers.delete('origin');

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Invalid JSON' });
  });

  it('should return 200 for valid JSON', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ type: 'thumbs-up', solutionLength: 100 }),
    });
    // Ensure no origin header so it passes dev mode check
    request.headers.delete('origin');

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
});
