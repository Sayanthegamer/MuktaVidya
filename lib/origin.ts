export const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://muktavidya.vercel.app',
  'https://open-solver.vercel.app',
].filter(Boolean) as string[];

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Allow requests without an origin in development or requests from localhost
  if (isDevelopment && (!origin || origin.startsWith('http://localhost:'))) {
    return true;
  }

  if (origin && ALLOWED_ORIGINS.some(o => o === origin)) {
    return true;
  }

  // Vercel Preview URL checks
  if (origin) {
    if (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) {
      return true;
    }
    if (process.env.VERCEL_BRANCH_URL && origin === `https://${process.env.VERCEL_BRANCH_URL}`) {
      return true;
    }
    if (process.env.VERCEL_PROJECT_NAME) {
      try {
        const url = new URL(origin);
        if (
          url.protocol === 'https:' &&
          (url.hostname === 'vercel.app' || url.hostname.endsWith('.vercel.app')) &&
          ((url.hostname === `${process.env.VERCEL_PROJECT_NAME}.vercel.app`) || (new RegExp(`^${process.env.VERCEL_PROJECT_NAME}-[a-zA-Z0-9]{8,11}-[a-zA-Z0-9-]+\\.vercel\\.app$`).test(url.hostname)))
        ) {
          return true;
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  }

  return false;
}
