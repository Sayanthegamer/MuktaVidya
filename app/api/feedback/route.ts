export async function POST(request: Request) {
  try {
    const { type, solutionLength } = await request.json();
    console.log(`[Feedback] Type: ${type}, Solution Length: ${solutionLength}`);
    // In a real app, you would log this to Supabase or another DB.
    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
}
