import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '@/lib/env';
import { ratelimit } from '@/lib/rateLimit';
import { isAllowedOrigin } from '@/lib/origin';
import { extractIP } from '@/lib/ip';
import { readJsonBody, PayloadTooLargeError, EmptyBodyError } from '@/lib/payload';
import { NextRequest, NextResponse } from 'next/server';
import { SolveMode } from '@/hooks/useMode';

let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return aiInstance;
}

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  imageBase64?: string;
}

interface SolveRequestBody {
  messages?: ChatMessage[];
  language?: string;
  mode?: SolveMode;
}

export async function POST(request: Request | NextRequest) {
  const isAllowed = isAllowedOrigin(request);

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  const ip = extractIP(request);

  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "You're studying too fast! Wait 60 seconds." },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  let bodyData: SolveRequestBody;
  try {
    bodyData = await readJsonBody<SolveRequestBody>(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    if (error instanceof EmptyBodyError) {
      return NextResponse.json({ error: 'No body provided' }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    console.error('Solve API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const { messages, language, mode } = bodyData;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  if (messages.length > 50) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 400 });
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return NextResponse.json({ error: `Invalid message at index ${i}` }, { status: 400 });
    }
    if (typeof msg.text === 'string' && msg.text.length > 10000) {
      return NextResponse.json(
        { error: `Message text at index ${i} exceeds the maximum length of 10000 characters` },
        { status: 400 }
      );
    }
    const hasText = typeof msg.text === 'string' && msg.text.trim().length > 0;
    const hasImage = typeof msg.imageBase64 === 'string' && msg.imageBase64.length > 0;
    if (!hasText && !hasImage) {
      return NextResponse.json(
        { error: `Message at index ${i} has neither text nor image content` },
        { status: 400 }
      );
    }
  }

  const upperLang = typeof language === 'string' ? language.toUpperCase() : 'EN';
  const langInstruction = upperLang !== 'EN'
    ? `\nRespond entirely in ${upperLang === 'BN' ? 'Bengali' : upperLang === 'HI' ? 'Hindi' : upperLang}. Use LaTeX for all math notation regardless of language.`
    : '';

  const modeInstruction = mode === 'FASTEST'
    ? `\n\nPRIORITY INSTRUCTION: Provide the FASTEST and SHORTEST approach with the best solvability. Do NOT use overly complex, fabricated, or advanced college-level formulas if a simpler standard method exists. Be concise but accurate.`
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

SCIENTIFIC CHARTS & VISUAL DIAGRAMS:
If a problem benefits from a visual aid, choose the exact block format based on the subject matter requirements below:

1. Use standard mathematical plotting or data sequences (e.g. Kinematics, Cartesian plots, statistical distributions): Output an Apache ECharts options layout wrapped inside a \`\`\`json-chart code block. Only output structural keys: "title", "xAxis", "yAxis", "series". Do NOT output colors or design stylings.

2. For structural schemas, physics diagrams, chemistry models, or logical layouts (e.g., LCR/Circuit Schematics, Ray Optics/Lenses, Venn Diagrams, Chemical Compounds/Bonds, Molecular Structures): Output a standalone, well-formed vector graphic configuration wrapped exactly inside a \`\`\`svg-diagram code block.

RULES FOR GENERATING HIGH-ACCURACY \`\`\`svg-diagram:
- Always declare a clear coordinate space via responsive view boxes: <svg viewBox="0 0 400 250">
- For visibility, paths and structural lines must explicitly use structural outline properties: stroke="#ffffff" stroke-width="2" fill="none". (The app frontend automatically remaps white outlines into flexible local theme variables dynamically).
- Place clear text descriptive tags using <text fill="#ffffff" font-size="12"> at distinct coordinates near components so labels are readable and do not overlap.
- Keep structural vector primitives clean and compact (<line>, <circle>, <path>, <rect>, <text>). Do not append markdown notes or descriptions inside the code block envelope.
${langInstruction}${modeInstruction}`;

  try {
    const contents = messages.map((msg) => {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (msg.text) {
        parts.push({ text: msg.text });
      }

      if (msg.imageBase64) {
        let mimeType = 'image/jpeg';
        let base64Data = msg.imageBase64;

        if (msg.imageBase64.startsWith('data:')) {
          const commaIndex = msg.imageBase64.indexOf(',');
          const colonIndex = msg.imageBase64.indexOf(':');
          const semicolonIndex = msg.imageBase64.indexOf(';');
          if (colonIndex !== -1 && semicolonIndex !== -1 && semicolonIndex > colonIndex) {
            mimeType = msg.imageBase64.substring(colonIndex + 1, semicolonIndex);
          }
          if (commaIndex !== -1) {
            base64Data = msg.imageBase64.substring(commaIndex + 1);
          }
        }

        parts.push({ inlineData: { mimeType, data: base64Data } });
      }

      return {
        role: msg.role === 'model' ? ('model' as const) : ('user' as const),
        parts,
      };
    });

    const ai = getAI();
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const fallbackModels = ['gemini-2.5-flash', 'gemini-2.0-flash'].filter((m) => m !== primaryModel);
    const candidateModels = [primaryModel, ...fallbackModels];


    let responseStream;
    let lastError: unknown;
    for (const model of candidateModels) {
      try {
        responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
          },
        });
        break;
      } catch (modelError) {
        lastError = modelError;
        console.warn(`Gemini model ${model} failed, attempting next fallback...`, modelError);
      }
    }

    if (!responseStream) {
      throw lastError || new Error('Failed to generate content with available models');
    }

    let isStreamErrored = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (request.signal?.aborted) {
              break;
            }
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (streamError) {
          isStreamErrored = true;
          controller.error(streamError);
        } finally {
          if (!isStreamErrored) {
            try {
              controller.close();
            } catch {
              // Ignore if already closed
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Solve API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
