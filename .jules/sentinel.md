# 2025-06-03 - Insecure CORS origin matching for Vercel preview domains

**Vulnerability:** The CORS origin check in `lib/origin.ts` loosely checks if `url.hostname.includes('-' + process.env.VERCEL_PROJECT_NAME + '-')`. This allows an attacker to bypass CORS restrictions by registering a Vercel project name that simply includes `-{VERCEL_PROJECT_NAME}-`, such as `https://attacker-muktavidya-evil.vercel.app`.
**Learning:** Checking for substrings in origin hostnames is a common security pitfall. Vercel preview URLs usually follow the format `[project-name]-[git-hash]-[workspace].vercel.app` or similar, but checking merely for `-projectname-` within any `.vercel.app` subdomain is easily spoofable by an attacker creating their own project with a name that contains that exact string.
**Prevention:** Origin validation logic must be exact or use robust regular expressions tied to the specific structure. Vercel preview URLs usually start with the project name `[project-name]-`.

## 2025-06-03 - IP Spoofing & Auth Bypass in Feedback API
**Vulnerability:** The `app/api/feedback/route.ts` API blindly trusted the leftmost IP extracted from the `x-forwarded-for` header (`forwardedFor.split(',')[0].trim()`). An attacker could trivially bypass rate limits by spoofing this header with random IPs.
**Learning:** `x-forwarded-for` represents the original client's IP only if the entire proxy chain is trusted. Because Next.js applications on Vercel sit behind Vercel's Edge network, the safe extraction requires prioritizing Vercel's protected `x-vercel-forwarded-for` header, or failing that, `x-real-ip`.
**Prevention:** Always extract IPs prioritizing platform-secured headers over general `x-forwarded-for`. Ensure any fallback to `x-forwarded-for` is strictly a last resort.

## 2025-06-03 - Stack Trace / Error Details Leakage
**Vulnerability:** The `/api/solve` route was catching general execution errors and piping `error.message` directly into a client-facing 500 JSON response (`{ error: message }`).
**Learning:** Returning dynamic JS error messages directly to the client is unsafe. It can leak internal application state, database connection strings, or underlying SDK implementation details (e.g. Gemini SDK internals).
**Prevention:** Fail securely by logging the actual error internally using `console.error` and returning a static, sanitized string like "Internal Server Error" to the frontend.

## 2026-06-07 - Add 'style' to FORBID_TAGS in DOMPurify to prevent CSS Injection

**Vulnerability:** The application uses DOMPurify to sanitize AI-generated SVGs (`components/DiagramRenderer/DiagramRenderer.tsx`), but by default DOMPurify permits the `<style>` tag. Maliciously crafted `<style>` tags within SVGs can lead to CSS Injection or XSS vulnerabilities, potentially altering the entire page's display or exfiltrating data via CSS techniques.
**Learning:** While DOMPurify strips active content like scripts and event handlers, CSS manipulation via allowed `<style>` tags inside SVG rendering remains a risk when using `dangerouslySetInnerHTML`.
**Prevention:** Always add `'style'` to `FORBID_TAGS` when sanitizing standalone SVG or user-generated HTML fragments unless CSS styling is explicitly required and tightly constrained.
## 2026-06-07 - Add payload size validation to prevent DoS via massive JSON parsing
**Vulnerability:** The `/api/feedback` route invoked `await request.json()` directly without bounding the maximum allowed body size. A malicious user could submit a multimegabyte payload designed to consume all server memory (OOM) or block the event loop while attempting to parse the massive JSON document.
**Learning:** Next.js API Routes (using Edge or Node environments) don't enforce strict body parsing bounds for arbitrary `Request` objects out of the box like traditional middleware. Security headers like `content-length` can be easily spoofed or bypassed.
**Prevention:** Always implement an application-level hard boundary using `MAX_BODY_BYTES`. Check `content-length` for early fast-fail, then subsequently track the actual bytes decoded (via `TextEncoder` on `request.text()` or using streams) before calling `JSON.parse()`.

## 2026-06-07 - Add logical payload validation to prevent application-layer abuse
**Vulnerability:** While `/api/solve` enforced a raw byte size limit (`MAX_BODY_BYTES`) to prevent memory exhaustion, it did not restrict the internal length or structure of the JSON contents. A malicious actor could submit a payload that fits within 10MB but contains thousands of empty messages or excessively long individual text fields (e.g., a single 5MB string). This could trigger expensive backend processing or easily exhaust rate limits and quota allocations with the upstream Gemini API.
**Learning:** Raw byte limits are only the first line of defense against DoS. Application-layer validation (such as enforcing maximum array lengths or string lengths for specific properties) is required to prevent semantic abuse that bypassed size constraints.
**Prevention:** In addition to byte-level `MAX_BODY_BYTES` checks, always explicitly validate the semantic properties of incoming parsed JSON payloads, explicitly restricting array counts and string lengths to practical boundaries.
## 2026-06-07 - Add payload size validation to prevent DoS via massive JSON parsing in Feedback API
**Vulnerability:** The `/api/feedback` route invoked `await request.text()` directly without bounding the maximum allowed body size chunk by chunk. A malicious user could submit a payload designed to consume all server memory (OOM).
**Learning:** Next.js API Routes don’t natively stop reading stream on memory usage limits by default without manual validation.
**Prevention:** Use a byte accumulator via `request.body.getReader()` to manually read chunks and cancel the stream proactively if the size limit gets exceeded.
