import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/lib/env';
import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';
import { extractIP } from '@/lib/ip';
import { NextRequest } from 'next/server';
import { SolveMode } from '@/hooks/useMode';
import { buildSystemPrompt } from './prompt';

// Lazy initialization to avoid build-time env-var issues
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return aiInstance;
}

const MAX_BODY_BYTES = 10 * 1024 * 1024; // Increased to 10MB to support multiple images in history

export interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  imageBase64?: string;
}

async function checkRateLimit(request: NextRequest): Promise<Response | null> {
  const ip = extractIP(request);

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "You're studying too fast! Wait 60 seconds." }),
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

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

    const bodyString = new TextDecoder().decode(totalBuffer);

    let bodyData;
    try {
      bodyData = JSON.parse(bodyString);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { messages, language, mode } = bodyData as { messages?: ChatMessage[], language?: string, mode?: SolveMode };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: 'Too many messages' }), { status: 400 });
    }

    // Validate that all messages have either text or imageBase64
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.text && msg.text.length > 10000) {
        return new Response(JSON.stringify({ error: `Message text at index ${i} exceeds the maximum length of 10000 characters` }), { status: 400 });
      }
      const hasText = msg.text && msg.text.trim().length > 0;
      const hasImage = msg.imageBase64 && msg.imageBase64.length > 0;
      if (!hasText && !hasImage) {
        return new Response(
          JSON.stringify({ error: `Message at index ${i} has neither text nor image content` }),
          { status: 400 }
        );
      }
    }

    const systemPrompt = buildSystemPrompt(language, mode);
    
    // Map our messages to Gemini API format
    let systemPromptInjected = false;
    const contents = messages.map((msg) => {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Inject system prompt into the first user message
      if (msg.role === 'user' && !systemPromptInjected) {
        parts.push({ text: systemPrompt });
        systemPromptInjected = true;
      }

      if (msg.text) {
        parts.push({ text: msg.text });
      }

      if (msg.imageBase64) {
        let mimeType = 'image/jpeg';
        let base64Data = msg.imageBase64;

        // Validate proper data URL format: data:<mime>;base64,<data>
        if (msg.imageBase64.startsWith('data:')) {
          const base64Index = msg.imageBase64.indexOf(';base64,');
          if (base64Index !== -1) {
            // Extract MIME type between 'data:' and ';base64,'
            mimeType = msg.imageBase64.substring(5, base64Index);
            base64Data = msg.imageBase64.substring(base64Index + 8);
          }
        }

        parts.push({ inlineData: { mimeType, data: base64Data } });
      }

      return {
        role: msg.role === 'model' ? 'model' : 'user',
        parts: parts
      };
    });

    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (streamError) {
          controller.error(streamError);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: unknown) {
    console.error('Solve API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
