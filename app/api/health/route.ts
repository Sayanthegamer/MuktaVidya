import { NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rateLimit';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    hasRateLimiting: Boolean(ratelimit),
    timestamp: new Date().toISOString(),
  });
}

