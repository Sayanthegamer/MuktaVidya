const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://open-solver.vercel.app',
].filter(Boolean);

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

  try {
    const { type, solutionLength } = await request.json();
    console.log(`[Feedback] Type: ${type}, Solution Length: ${solutionLength}`);
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
