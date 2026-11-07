import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
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
  ...(isDev
    ? []
    : [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://platform.twitter.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://i.imgflip.com https://*.giphy.com https://*.twimg.com",
            "frame-src 'self' https://platform.twitter.com",
            "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://openrouter.ai https://publish.twitter.com",
          ].join('; '),
        },
      ]),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
