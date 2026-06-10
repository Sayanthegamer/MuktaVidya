#!/bin/bash
cat << 'INNER_EOF' > app/api/solve/route.test.ts
/** @jest-environment node */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/env', () => ({
  getGeminiApiKey: jest.fn().mockReturnValue('mock-api-key'),
}));

jest.mock('@/lib/rateLimit', () => ({
  ratelimit: {
    limit: jest.fn(),
  },
}));

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn().mockResolvedValue([
        { text: 'mock response part 1' },
        { text: 'mock response part 2' }
      ]),
    },
  })),
}));

import { ratelimit } from '@/lib/rateLimit';

describe('POST /api/solve IP Extraction Security', () => {
  beforeEach(() => {
    (ratelimit.limit as jest.Mock).mockResolvedValue({ success: true });
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
      body: JSON.stringify({ messages: [{ role: 'user', imageBase64: 'data:image/jpeg;base64,mock' }], language: 'en' }),
    });
    return req;
  };

  it('extracts IP and checks ratelimit', async () => {
    const req = createRequestWithHeaders({
      'x-vercel-forwarded-for': '203.0.113.1',
    });

    await POST(req);
    expect(ratelimit.limit).toHaveBeenCalledWith('203.0.113.1');
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

describe('Solve API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ratelimit.limit as jest.Mock).mockResolvedValue({ success: true });
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = 'test';
  });

  it('rejects payloads exceeding MAX_BODY_BYTES even if content-length header is 0', async () => {
    // Create a body larger than 5MB
    // Using string repetition to generate ~6MB of data
    const largeData = 'A'.repeat(11 * 1024 * 1024);
    const bodyContent = JSON.stringify({
      imageBase64: `data:image/jpeg;base64,${largeData}`,
      language: 'EN'
    });

    // Create a mock stream for the body
    const encoder = new TextEncoder();
    const bodyBuffer = encoder.encode(bodyContent);

    // Split into chunks to simulate streaming
    const chunks: Uint8Array[] = [];
    const chunkSize = 1024 * 1024; // 1MB chunks
    for (let i = 0; i < bodyBuffer.length; i += chunkSize) {
      chunks.push(bodyBuffer.slice(i, i + chunkSize));
    }

    let chunkIndex = 0;
    const mockBody = new ReadableStream({
      pull(controller) {
        if (chunkIndex < chunks.length) {
          controller.enqueue(chunks[chunkIndex]);
          chunkIndex++;
        } else {
          controller.close();
        }
      }
    });

    const request = new Request('http://localhost:3000/api/solve', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'content-type': 'application/json',
        // Simulate spoofed content-length
        'content-length': '0'
      },
      // Using custom stream instead of normal fetch body to ensure we stream it
      body: mockBody,
      duplex: 'half'
    } as RequestInit);

    const response = await POST(request);

    expect(response.status).toBe(413);

    const responseData = await response.json();
    expect(responseData).toEqual({ error: 'Payload too large' });
  });

  it('processes valid requests normally', async () => {
    const bodyContent = JSON.stringify({
      messages: [{ role: 'user', imageBase64: 'data:image/jpeg;base64,validbase64' }],
      language: 'EN'
    });

    const request = new Request('http://localhost:3000/api/solve', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'content-type': 'application/json',
        'content-length': String(bodyContent.length)
      },
      body: bodyContent
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain; charset=utf-8');

    // Read the stream response
    const reader = response.body?.getReader();
    let result = '';

    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
    }

    expect(result).toBe('mock response part 1mock response part 2');
  });
});

describe('Solve API Error Handling Security', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress expected error logs
    (ratelimit.limit as jest.Mock).mockResolvedValue({ success: true });
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    console.error = originalConsoleError;
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = 'test';
  });

  it('masks internal error details and returns a generic 500 error', async () => {
    // Force an error by causing a JSON parse exception manually or using a faulty request
    const request = new Request('http://localhost:3000/api/solve', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'content-type': 'application/json',
        'content-length': '10'
      },
      // Using custom stream that throws an error to trigger the catch block
      body: new ReadableStream({
        start(controller) {
          controller.error(new Error('SENSITIVE_INTERNAL_DATABASE_ERROR'));
        }
      }),
      duplex: 'half'
    } as RequestInit);

    const response = await POST(request as unknown as NextRequest);

    expect(response.status).toBe(500);
    const data = await response.json();

    // Ensure the sensitive error message is NOT leaked to the client
    expect(data.error).toBe('Internal Server Error');
    expect(data.error).not.toContain('SENSITIVE_INTERNAL_DATABASE_ERROR');

    // Ensure the error was actually logged internally
    expect(console.error).toHaveBeenCalled();
  });
});
INNER_EOF
