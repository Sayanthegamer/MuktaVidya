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
    (isDevelopment && (!origin || origin.startsWith('http://localhost:'))) ||
    (origin && ALLOWED_ORIGINS.includes(origin)) ||
    (origin && (
      (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) ||
      (process.env.VERCEL_BRANCH_URL && origin === `https://${process.env.VERCEL_BRANCH_URL}`)
    ));

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

ACCURACY & ANTI-HALLUCINATION:
- Double-check all intermediate calculations step-by-step. Do not skip logical steps.
- If a value in the image is illegible, state your assumption clearly before proceeding.

FORMATTING STRICT RULES:
- Use standard Markdown. 
- Use $...$ for inline and $$...$$ for display LaTeX. Ensure brackets are properly closed.

CRITICAL MERMAID.JS GUARDRAILS:
Whenever a visual aid (free-body diagram, flowchart, reaction pathway) clarifies the solution, generate a diagram using a \`\`\`mermaid code block.
1. USE BASIC GRAPHS: Stick to robust diagram types like \`flowchart TD\` or \`graph LR\`.
2. QUOTE ALL LABELS: You MUST wrap all node text in double quotes to prevent syntax errors. Correct: A["Force (mg)"] --> B["Tension (T)"]. Incorrect: A(Force) --> B(Tension).
3. NO LATEX IN MERMAID: NEVER put Markdown formatting or LaTeX ($...$) inside a mermaid diagram block. Keep node text as simple, plain English characters.
4. NO NESTING: Do not place code blocks inside other code blocks.${langInstruction}`;
    
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-lite',
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
