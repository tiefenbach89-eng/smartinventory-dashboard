// next.config.ts
import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';

const config: NextConfig = {
  // Kein experimental.turbo mehr nötig
};

// ⬇️ Hier der wichtige Fix:
export default withNextIntl('./i18n/index.ts')(config);
