import { ratelimit } from '@/lib/rateLimit';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://open-solver.vercel.app',
].filter(Boolean);

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  const isDevelopment = process.env.NODE_ENV === 'development';

  const isAllowed =
    (isDevelopment && !origin) ||
    (origin && ALLOWED_ORIGINS.includes(origin)) ||
    (origin && process.env.VERCEL_PROJECT_NAME && (() => {
      try {
        const url = new URL(origin);
        return url.protocol === 'https:' &&
               url.hostname.endsWith('.vercel.app') &&
               url.hostname.includes(`-${process.env.VERCEL_PROJECT_NAME}-`);
      } catch {
        return false;
      }
    })());

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  try {
    const { type, solutionLength } = await request.json();
    console.log(`[Feedback] Type: ${type}, Solution Length: ${solutionLength}`);
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
