export class PayloadTooLargeError extends Error {
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

export class EmptyBodyError extends Error {
  constructor(message = 'No body provided') {
    super(message);
    this.name = 'EmptyBodyError';
  }
}

/**
 * Safely reads and parses a JSON body from a Request with strict maximum byte size enforcement.
 * Protects against memory exhaustion DoS when Content-Length headers are omitted or spoofed.
 */
export async function readJsonBody<T = unknown>(request: Request, maxBytes: number): Promise<T> {
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > maxBytes) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    throw new EmptyBodyError();
  }

  const reader = request.body.getReader();
  let receivedBytes = 0;
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > maxBytes) {
          await reader.cancel();
          throw new PayloadTooLargeError();
        }
        chunks.push(value);
      }
    }
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      throw err;
    }
    throw err;
  }

  if (receivedBytes === 0) {
    throw new EmptyBodyError();
  }

  const combined = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(combined);
  return JSON.parse(text) as T;
}
