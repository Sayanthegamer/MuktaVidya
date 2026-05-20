import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';

export async function POST(request: Request) {

  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  // Next.js >= 15 removed `request.ip`. Safely parse `x-forwarded-for` to get the real client IP.
  let ip = '127.0.0.1';
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs.
    // The left-most IP is the original client IP.
    ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  try {
    await request.json();
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
