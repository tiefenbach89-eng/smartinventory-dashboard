import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// ✅ Explizit Webpack statt Turbopack erzwingen
const baseConfig: NextConfig = {
  // Wichtig: Deaktiviert Turbopack global
  experimental: {
    // @ts-expect-error - Next.js 16 types missing turbo flag
    turbo: false
  },

  webpack: (config) => config,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },

  transpilePackages: ['geist']
};

let configWithPlugins = baseConfig;

if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
  configWithPlugins = withSentryConfig(configWithPlugins, {
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: { enabled: true },
    tunnelRoute: '/monitoring',
    disableLogger: true,
    telemetry: false
  });
}

const nextConfig = configWithPlugins;
export default nextConfig;
