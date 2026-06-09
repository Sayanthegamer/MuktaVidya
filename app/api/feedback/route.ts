import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit

export async function POST(request: Request) {

  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  // Next.js >= 15 removed `request.ip`. Securely extract IP prioritizing Vercel's trusted headers
  // over the easily spoofed x-forwarded-for header.
  let ip = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');
  if (!ip) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Fallback securely by parsing the header
      ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
    } else {
      ip = '127.0.0.1';
    }
  }

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
    }

    if (bodyText) {
      JSON.parse(bodyText);
    }
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
