import nextConfig from './next.config';

describe('next.config CSP headers', () => {
  it('includes worker-src and child-src with blob: to permit web worker image compression', async () => {
    if (typeof nextConfig.headers !== 'function') {
      throw new Error('nextConfig.headers is not a function');
    }

    const headersList = await nextConfig.headers();
    const globalHeaderRule = headersList.find((h) => h.source === '/:path*');
    expect(globalHeaderRule).toBeDefined();

    const cspHeader = globalHeaderRule?.headers.find((h) => h.key === 'Content-Security-Policy');
    expect(cspHeader).toBeDefined();

    const cspValue = cspHeader?.value || '';
    expect(cspValue).toContain("worker-src 'self' blob: https://cdn.jsdelivr.net;");
    expect(cspValue).toContain("child-src 'self' blob: https://cdn.jsdelivr.net;");
    expect(cspValue).toContain("https://cdn.jsdelivr.net");
  });
});

