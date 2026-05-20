import { POST } from './route';

describe('POST /api/feedback', () => {
  it('should return 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: 'invalid-json',
    });
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
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
});
