# ADR-0006: Streamlined Build and Removal of Inactive PWA Serwist Layer

## Context
The project had `@serwist/next` configured in `package.json` and `next.config.ts`, requiring `next build --webpack` to be specified and forcing Next.js to bypass Turbopack. Generated bundles (`public/sw.js` and `public/workbox-*.js`) were committed directly to Git. However, the client never called `navigator.serviceWorker.register` or mounted Serwist providers, meaning the service worker was completely dormant and never active. For an online AI exam solver requiring real-time Gemini streaming, offline caching is minimal and prone to caching stale API responses.

## Decision
1. Remove `@serwist/next` and `serwist` dependencies.
2. Remove committed `public/sw.js`, `public/sw.js.map`, `public/workbox-*.js`, and `app/sw.ts`.
3. Restore standard Next.js build (`next build`) without forced Webpack, allowing Turbopack compilation.
4. Clean up `next.config.ts`.

## Status
Accepted

## Consequences
- Significant reduction in build time and memory usage.
- Unlocks Next.js Turbopack compiler.
- Eliminates ghost service worker caching bugs.
- Shrinks git repository size by deleting binary/vendor JS bundles.
