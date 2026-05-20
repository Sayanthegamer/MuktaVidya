import { POST } from './route';

// Mock dependencies
jest.mock('../../../lib/env.ts', () => ({
  getGeminiApiKey: jest.fn().mockReturnValue('mock-api-key'),
}));

jest.mock('../../../lib/rateLimit.ts', () => ({
  ratelimit: {
    limit: jest.fn().mockResolvedValue({ success: true }),
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

describe('Solve API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const largeData = 'A'.repeat(6 * 1024 * 1024);
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
      imageBase64: 'data:image/jpeg;base64,validbase64',
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
