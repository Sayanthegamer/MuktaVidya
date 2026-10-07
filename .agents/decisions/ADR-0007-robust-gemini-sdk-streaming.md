# ADR-0007: Robust Gemini SDK Streaming & Request Lifecycle

## Context
`app/api/solve/route.ts` used `@google/genai` (v2.3.0) but exhibited several severe anti-patterns:
1. Manually prepending system instructions into the first user turn instead of using `@google/genai`'s official `config: { systemInstruction: ... }`.
2. Calling `controller.close()` in a `finally` block after `controller.error()`, which crashes WHATWG streams.
3. Ignoring `request.signal`, causing Gemini to continue streaming and burning API tokens after user cancellation.
4. Re-implementing manual `request.body.getReader()` loops and `Uint8Array` buffer reassembly for request parsing.

## Decision
1. Retain `@google/genai` (avoiding extraneous third-party wrapper dependencies).
2. Use official `ai.models.generateContentStream({ model, contents, config: { systemInstruction } })`.
3. Link abort signals and safely guard `ReadableStream` error state transitions.
4. Add standard streaming HTTP headers (`Cache-Control: no-cache, no-transform`).
5. Replace manual reader loops with clean, standard request body parsing and validation.

## Status
Accepted

## Consequences
- Reliable token streaming with immediate client abort responsiveness.
- Zero server-side unhandled stream closures.
- Secure prompt boundaries preventing prompt injection in multi-turn history.
