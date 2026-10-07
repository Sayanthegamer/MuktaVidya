import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';
import { extractIP } from '@/lib/ip';
import { readJsonBody, PayloadTooLargeError } from '@/lib/payload';
import { NextResponse } from 'next/server';

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB limit

export interface FeedbackPayload {
  type?: string;
  solutionLength?: number;
  content?: string;
}

export async function POST(request: Request) {
  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const ip = extractIP(request);

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
  }

  try {
    const data = await readJsonBody<FeedbackPayload>(request, MAX_BODY_BYTES);
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
