// i18n/index.ts
import {
  getRequestConfig,
  type GetRequestConfigParams,
  type RequestConfig
} from 'next-intl/server';

export default getRequestConfig(
  async ({ locale }: GetRequestConfigParams): Promise<RequestConfig> => {
    const supportedLocales = ['en', 'de', 'tr'] as const;
    const fallback = 'en';

    // falls locale undefined ist, fallback verwenden
    const currentLocale =
      locale &&
      supportedLocales.includes(locale as (typeof supportedLocales)[number])
        ? locale
        : fallback;

    // explizit sicherstellen, dass locale ein string ist
    return {
      locale: currentLocale as string,
      messages: (await import(`./messages/${currentLocale}.json`)).default
    };
  }
);
