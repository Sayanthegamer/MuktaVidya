import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/lib/env';
import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';
import { NextRequest } from 'next/server';

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

export async function POST(request: NextRequest) {

  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  // Secure IP extraction
  let ip = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');
  if (!ip) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else {
      ip = '127.0.0.1';
    }
  }
  
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

    const bodyString = new TextDecoder().decode(totalBuffer);

    let bodyData;
    try {
      bodyData = JSON.parse(bodyString);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { messages, language } = bodyData as { messages?: ChatMessage[], language?: string };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
    }

    // Build language-aware structured prompt
    const upperLang = typeof language === 'string' ? language.toUpperCase() : 'EN';
    const langInstruction = upperLang !== 'EN'
      ? `\nRespond entirely in ${upperLang === 'BN' ? 'Bengali' : 'Hindi'}. Use LaTeX for all math notation regardless of language.`
      : '';

   const systemPrompt = `You are an elite academic evaluator specialized in Indian competitive exams (WBJEE, JEE Main, NEET).
Analyze the image or answer the user's question. For the first image, identify the subject (Physics/Chemistry/Mathematics/Biology) and structure your response as: ### Subject, ### Given, ### Approach, ### Solution, ### Answer. For MCQs, state which option is correct and why others are wrong.
For follow-up questions, act as a helpful tutor guiding the student through the problem.

ACCURACY & ANTI-HALLUCINATION:
- Double-check all intermediate calculations step-by-step. Do not skip logical steps.
- If a value in the image is illegible, state your assumption clearly before proceeding.

FORMATTING STRICT RULES:
- EXAM PAPER FORMAT: Separate each logical step and every equation with a blank line. Do not write steps in a continuous paragraph.
- DISPLAY EQUATIONS: Place all main equations on their own separate lines, completely separated from text, using display LaTeX ($$...$$). Do NOT inline main equations.
- Use $...$ ONLY for short inline variables. Ensure brackets are properly closed.
- Use standard Markdown.

SCIENTIFIC CHARTS & DATA PLOTTING:
If the problem requires plotting mathematical functions, vectors, scatter plots, kinematics graphs, reaction pathways, free-body diagrams, flowcharts or any accurate visual, you MUST output an Apache ECharts JSON configuration wrapped EXACTLY in a \`\`\`json-chart code block.
1. The JSON must be strictly valid ECharts option format (e.g. { "xAxis": { ... }, "series": [ ... ] }).
2. Do NOT include any comments inside the JSON.
3. Example format:
\`\`\`json-chart
{
  "title": { "text": "Projectile Motion" },
  "xAxis": { "type": "value", "name": "Distance (m)" },
  "yAxis": { "type": "value", "name": "Height (m)" },
  "series": [{ "data": [[0,0], [5,10], [10,0]], "type": "line" }]
}
\`\`\`
${langInstruction}`;
    
    // Map our messages to Gemini API format
    let systemPromptInjected = false;
    const contents = messages.map((msg, index) => {
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
        const mimeMatch = msg.imageBase64.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = msg.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }

      // Ensure at least one part exists (guard against empty parts array)
      if (parts.length === 0) {
        parts.push({ text: '' });
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
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
