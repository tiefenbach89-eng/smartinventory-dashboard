'use client';

import { useTranslations } from 'next-intl';

export const useCategoryOptions = () => {
  const t = useTranslations('productCategories');

  return [
    { value: 'electronics', label: t('electronics') },
    { value: 'furniture', label: t('furniture') },
    { value: 'clothing', label: t('clothing') },
    { value: 'toys', label: t('toys') },
    { value: 'groceries', label: t('groceries') },
    { value: 'books', label: t('books') },
    { value: 'jewelry', label: t('jewelry') },
    { value: 'beauty', label: t('beauty') }
  ];
};
