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
