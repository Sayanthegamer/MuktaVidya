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
      // react-doctor-disable-next-line react-doctor/async-await-in-loop
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

    if (!bodyText) {
      throw new Error('Empty body');
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    if (typeof parsedBody !== 'object' || parsedBody === null || Array.isArray(parsedBody)) {
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), { status: 400 });
    }

    const { type, content } = parsedBody as { type?: string, content?: string };

    if (type !== 'up' && type !== 'down') {
      return new Response(JSON.stringify({ error: 'Invalid feedback type' }), { status: 400 });
    }

    if (content !== undefined) {
      if (typeof content !== 'string') {
        return new Response(JSON.stringify({ error: 'Content must be a string' }), { status: 400 });
      }
      if (content.length > 1000) {
        return new Response(JSON.stringify({ error: 'Content exceeds maximum length' }), { status: 400 });
      }
    }

    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Feedback API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
