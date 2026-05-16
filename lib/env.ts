export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to .env.local or your Vercel dashboard.'
    );
  }
  return key;
}
