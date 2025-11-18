'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { IconSlash } from '@tabler/icons-react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  const t = useTranslations('breadcrumbs');

  if (items.length === 0) return null;

  // 🔥 Titel-Mapping passend zu deinen JSON-Keys
  const mapTitleToKey = (title: string): string | null => {
    const normalized = title.trim().toLowerCase();

    switch (normalized) {
      case 'dashboard':
        return 'dashboard';

      case 'overview':
        return 'overview';

      case 'products':
      case 'product':
      case 'product list':
        return 'products';

      // NEW
      case 'new':
      case 'new product':
        return 'new_product';

      // EDIT
      case 'edit':
      case 'edit product':
      case 'product details':
        return 'edit_product';

      case 'accounts':
        return 'accounts';

      case 'settings':
      case 'account settings':
        return 'settings';

      case 'profile':
        return 'profile';

      default:
        return null;
    }
  };

  const translateTitle = (title: string): string => {
    const key = mapTitleToKey(title);
    if (!key) return title;

    try {
      return t(key);
    } catch {
      return title;
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const translated = translateTitle(item.title);

          return (
            <Fragment key={item.title}>
              {index !== items.length - 1 && (
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href={item.link}>{translated}</BreadcrumbLink>
                </BreadcrumbItem>
              )}

              {index < items.length - 1 && (
                <BreadcrumbSeparator className='hidden md:block'>
                  <IconSlash />
                </BreadcrumbSeparator>
              )}

              {index === items.length - 1 && (
                <BreadcrumbPage>{translated}</BreadcrumbPage>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
