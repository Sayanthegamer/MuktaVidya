import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';
import { extractIP } from '@/lib/ip';

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit

export async function POST(request: Request) {

  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const ip = extractIP(request);

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
        if (receivedLength > MAX_BODY_BYTES) {
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
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
