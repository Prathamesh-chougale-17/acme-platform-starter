import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@acme/config', '@acme/shared', '@acme/ui'],
  typedRoutes: true,
  output: 'standalone',
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
