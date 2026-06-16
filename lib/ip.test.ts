/** @jest-environment node */
import { extractIP } from './ip';

describe('extractIP', () => {
  const createRequest = (headers: Record<string, string>) => {
    return new Request('http://localhost/', {
      headers: new Headers(headers)
    });
  };

  it('prioritizes x-vercel-forwarded-for over x-forwarded-for', () => {
    const req = createRequest({
      'x-vercel-forwarded-for': '203.0.113.1',
      'x-forwarded-for': '198.51.100.1, 10.0.0.1',
    });
    expect(extractIP(req)).toBe('203.0.113.1');
  });

  it('prioritizes x-real-ip over x-forwarded-for if vercel header is missing', () => {
    const req = createRequest({
      'x-real-ip': '203.0.113.2',
      'x-forwarded-for': '198.51.100.2, 10.0.0.2',
    });
    expect(extractIP(req)).toBe('203.0.113.2');
  });

  it('falls back to x-forwarded-for securely (taking the first IP) if proxy headers are missing', () => {
    const req = createRequest({
      'x-forwarded-for': '198.51.100.3, 10.0.0.3',
    });
    expect(extractIP(req)).toBe('198.51.100.3');
  });

  it('securely extracts the first IP from a spoofed x-forwarded-for header', () => {
    const req = createRequest({
      'x-forwarded-for': '10.0.0.1, 192.168.1.1, 8.8.8.8',
    });
    expect(extractIP(req)).toBe('10.0.0.1');
  });

  it('uses 127.0.0.1 if no IP headers are present', () => {
    const req = createRequest({});
    expect(extractIP(req)).toBe('127.0.0.1');
  });

  it('securely falls back to 127.0.0.1 if x-vercel-forwarded-for contains only whitespace', () => {
    const req = createRequest({
      'x-vercel-forwarded-for': '   ',
    });
    expect(extractIP(req)).toBe('127.0.0.1');
  });
});
