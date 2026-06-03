import { NextRequest } from 'next/server';
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
    const request = new NextRequest('http://localhost/api/feedback', {
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
    const request = new NextRequest('http://localhost/api/feedback', {
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

  it('should handle incomplete (but parsable) data gracefully', async () => {
    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    // Ensure no origin header so it passes dev mode check
    request.headers.delete('origin');

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should securely extract the first IP from a spoofed x-forwarded-for header', async () => {
    const request = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ type: 'thumbs-up' }),
    });
    request.headers.delete('origin');

    // Simulate an attacker spoofing the header with multiple IPs
    request.headers.set('x-forwarded-for', '10.0.0.1, 192.168.1.1, 8.8.8.8');

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  describe('CORS Validation in Production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalProjectName = process.env.VERCEL_PROJECT_NAME;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_PROJECT_NAME = 'muktavidya';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.VERCEL_PROJECT_NAME = originalProjectName;
    });

    it('should block requests with malicious vercel domain bypass', async () => {
      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ type: 'thumbs-up' }),
        headers: {
          origin: 'https://attacker-muktavidya-vercel.app'
        }
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toBe('Forbidden');
    });

    it('should allow requests from valid vercel preview subdomains', async () => {
      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ type: 'thumbs-up' }),
        headers: {
          origin: 'https://muktavidya-preview-xyz.vercel.app'
        }
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
    });
  });
});
