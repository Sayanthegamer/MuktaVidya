import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/lib/env';
import { ratelimit } from '@/lib/rateLimit';

// Lazy initialization to avoid build-time env-var issues
function getAI() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
}

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://open-solver.vercel.app',
].filter(Boolean);

const MAX_BODY_BYTES = 5 * 1024 * 1024;

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

  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "You're studying too fast! Wait 60 seconds." }),
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  try {
    const { imageBase64, language } = await request.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image' }), { status: 400 });
    }

    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Build language-aware structured prompt
    const upperLang = typeof language === 'string' ? language.toUpperCase() : 'EN';
    const langInstruction = upperLang !== 'EN'
      ? `\nRespond entirely in ${upperLang === 'BN' ? 'Bengali' : 'Hindi'}. Use LaTeX for all math notation regardless of language.`
      : '';

    const systemPrompt = `You are an elite academic evaluator specialized in Indian competitive exams (WBJEE, JEE Main, NEET).
Analyze the image. First identify the subject (Physics/Chemistry/Mathematics/Biology).
Structure your response as: ### Subject, ### Given, ### Approach, ### Solution, ### Answer.
For MCQs, state which option is correct and why others are wrong.
Format using markdown. Use $...$ for inline and $$...$$ for display LaTeX.
CRITICAL: Whenever a visual aid would clarify the solution (e.g., a free-body diagram, basic circuit, chemical reaction pathway, or flowchart), you MUST generate a diagram using Mermaid.js syntax inside a \`\`\`mermaid code block.${langInstruction}`;

    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: systemPrompt }
          ]
        }
      ],
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
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
