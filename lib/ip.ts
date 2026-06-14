export function extractIP(request: Request): string {
  let ip = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip');

  if (!ip) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
    } else {
      ip = '127.0.0.1';
    }
  }

  return ip;
}
