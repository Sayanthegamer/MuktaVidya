import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    timestamp: new Date().toISOString(),
  });
}
