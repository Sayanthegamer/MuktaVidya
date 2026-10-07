import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'isomorphic-dompurify'],
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const cspValue = isDevelopment
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;";

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
