import { MAX_BODY_BYTES_FEEDBACK } from "@/lib/constants";
import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';



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
  if (contentLength > MAX_BODY_BYTES_FEEDBACK) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  try {
    if (!request.body) {
      return new Response(JSON.stringify({ error: 'No body provided' }), { status: 400 });
    }

    const reader = request.body.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        receivedLength += value.length;
        if (receivedLength > MAX_BODY_BYTES_FEEDBACK) {
          reader.cancel();
          return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
        }
        chunks.push(value);
      }
    }

    const totalBuffer = new Uint8Array(receivedLength);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const bodyText = new TextDecoder().decode(totalBuffer);

    if (bodyText) {
      JSON.parse(bodyText);
    }
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
