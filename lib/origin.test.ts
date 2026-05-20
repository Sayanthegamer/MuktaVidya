import { isAllowedOrigin, ALLOWED_ORIGINS } from './origin';

describe('isAllowedOrigin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows requests without origin in development', () => {
    process.env.NODE_ENV = 'development';
    const req = new Request('http://localhost:3000');
    // Request constructor might set origin to empty string or null depending on environment, we just ensure no origin header is provided
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('allows localhost origin in development', () => {
    process.env.NODE_ENV = 'development';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'http://localhost:3001' }
    });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('denies localhost origin in production', () => {
    process.env.NODE_ENV = 'production';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'http://localhost:3001' }
    });
    expect(isAllowedOrigin(req)).toBe(false);
  });

  it('allows explicitly allowed origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';
    // Re-evaluate allowed origins for the test by pushing to it or we rely on the ones we hardcoded
    if(!ALLOWED_ORIGINS.includes('https://muktavidya.vercel.app')) {
        ALLOWED_ORIGINS.push('https://muktavidya.vercel.app')
    }

    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://muktavidya.vercel.app' }
    });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('allows VERCEL_URL matches', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_URL = 'my-vercel-app.vercel.app';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://my-vercel-app.vercel.app' }
    });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('allows VERCEL_BRANCH_URL matches', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_BRANCH_URL = 'my-vercel-app-branch.vercel.app';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://my-vercel-app-branch.vercel.app' }
    });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('allows VERCEL_PROJECT_NAME matches', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_PROJECT_NAME = 'muktavidya';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://something-muktavidya-something.vercel.app' }
    });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('denies VERCEL_PROJECT_NAME mismatch on different domain', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_PROJECT_NAME = 'muktavidya';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://something-muktavidya-something.otherdomain.com' }
    });
    expect(isAllowedOrigin(req)).toBe(false);
  });

  it('denies unknown origins', () => {
    process.env.NODE_ENV = 'production';
    const req = new Request('http://localhost:3000', {
      headers: { origin: 'https://evil.com' }
    });
    expect(isAllowedOrigin(req)).toBe(false);
  });
});
