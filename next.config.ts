// next.config.ts
import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const config: NextConfig = {
  experimental: {
    // nur, damit du Webpack erzwingst – das ist okay
    // @ts-expect-error
    turbo: false
  }
};

// ⬇️ Hier der wichtige Fix:
export default withNextIntl('./i18n/index.ts')(config);
