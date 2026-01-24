import type { IconKey } from '@/components/icons';

export type NavItem = {
  key: string; // i18n key
  label: string; // localised label
  url: string;
  icon: IconKey;
  items?: {
    key: string; // i18n key
    label: string; // localised label
    url: string;
  }[];
};

/**
 * Generates translated navigation items
 * @param t next-intl translation function
 */
export const navItems = (t: (key: string) => string): NavItem[] => [
  {
    key: 'overview',
    label: t('nav.overview'),
    url: '/dashboard/overview',
    icon: 'dashboard'
  },
  {
    key: 'products',
    label: t('nav.products'),
    url: '/dashboard/product',
    icon: 'product',
    items: [
      {
        key: 'all_products',
        label: t('nav.all_products'),
        url: '/dashboard/product'
      },
      {
        key: 'new_product',
        label: t('nav.new_product'),
        url: '/dashboard/product/new'
      }
    ]
  },
  {
    key: 'barrel_oils',
    label: t('nav.barrel_oils'),
    url: '/dashboard/barrel-oils',
    icon: 'package'
  },
  {
    key: 'accounts',
    label: t('nav.accounts'),
    url: '/dashboard/accounts',
    icon: 'user'
  }
];
