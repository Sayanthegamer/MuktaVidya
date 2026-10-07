/** @jest-environment node */
import { GET } from './route';

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns status ok and key availability information', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.hasGeminiKey).toBe(true);
    expect(data.geminiModel).toBe('gemini-3.5-flash-lite');
  });

  it('reports false when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await GET();
    const data = await response.json();
    expect(data.hasGeminiKey).toBe(false);
  });
});
