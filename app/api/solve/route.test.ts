import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the rate limiter
jest.mock('@/lib/rateLimit', () => {
  return {
    ratelimit: {
      limit: jest.fn(),
    },
  };
});

// Mock the GenAI dependency
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContentStream: jest.fn().mockResolvedValue([{ text: 'mock answer' }]),
      },
    })),
  };
});

import { ratelimit } from '@/lib/rateLimit';

describe('POST /api/solve IP Extraction Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ratelimit.limit as jest.Mock).mockResolvedValue({ success: true });
    process.env.NODE_ENV = 'development';
  });

  const createRequestWithHeaders = (headers: Record<string, string>) => {
    const req = new NextRequest('http://localhost:3000/api/solve', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        ...headers,
      }),
      body: JSON.stringify({ imageBase64: 'data:image/jpeg;base64,mock', language: 'en' }),
    });
    return req;
  };

  it('prioritizes x-vercel-forwarded-for over x-forwarded-for', async () => {
    const req = createRequestWithHeaders({
      'x-vercel-forwarded-for': '203.0.113.1',
      'x-forwarded-for': '198.51.100.1, 10.0.0.1',
    });

    await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('203.0.113.1');
  });

  it('prioritizes x-real-ip over x-forwarded-for if vercel header is missing', async () => {
    const req = createRequestWithHeaders({
      'x-real-ip': '203.0.113.2',
      'x-forwarded-for': '198.51.100.2, 10.0.0.2',
    });

    await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('203.0.113.2');
  });

  it('falls back to x-forwarded-for securely (taking the first IP) if proxy headers are missing', async () => {
    const req = createRequestWithHeaders({
      'x-forwarded-for': '198.51.100.3, 10.0.0.3',
    });

    await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('198.51.100.3');
  });

  it('uses 127.0.0.1 if no IP headers are present', async () => {
    const req = createRequestWithHeaders({});
    await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('127.0.0.1');
  });

  it('returns 429 when rate limited based on extracted IP', async () => {
    (ratelimit.limit as jest.Mock).mockResolvedValue({ success: false });
    const req = createRequestWithHeaders({
       'x-vercel-forwarded-for': '203.0.113.4',
    });

    const res = await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('203.0.113.4');
    expect(res.status).toBe(429);

    const data = await res.json();
    expect(data.error).toBe("You're studying too fast! Wait 60 seconds.");
  });
});
