'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { navItems } from '@/constants/nav-items.intl';
import { useRolePermissions } from '@/hooks/useRolePermissions';

function isAdminRoute(url?: string | null) {
  if (!url) return false;
  return (
    url.startsWith('/dashboard/settings') ||
    url.startsWith('/dashboard/accounts')
  );
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const { permissions } = useRolePermissions();
  const canAccessAdmin = permissions?.can_access_admin_panel ?? false;

  const mainItems = React.useMemo(() => {
    const base = navItems(t);

    if (canAccessAdmin) return base;

    return base
      .map((item) => {
        const filteredSubs = item.items?.filter(
          (sub) => !isAdminRoute(sub.url)
        );

        if (isAdminRoute(item.url)) {
          if (!filteredSubs || filteredSubs.length === 0) return null;
        }

        if (item.items && (!filteredSubs || filteredSubs.length === 0)) {
          return isAdminRoute(item.url) ? null : { ...item, items: [] };
        }

        return { ...item, items: filteredSubs };
      })
      .filter(Boolean) as ReturnType<typeof navItems>;
  }, [t, canAccessAdmin]);

  const displayItems = mainItems.slice(0, 5);

  return (
    <>
      {/* Spacer */}
      <div className='h-[calc(64px+env(safe-area-inset-bottom))]' />

      {/* iOS-style Bottom Tab Bar */}
      <nav
        className='fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/92 backdrop-blur-xl'
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className='flex items-center justify-around px-1 py-1'>
          {displayItems.map((item) => {
            const IconComponent = Icons[item.icon] ?? Icons.logo;

            const isActive =
              pathname === item.url ||
              (item.items?.some((sub) => pathname === sub.url) ?? false);

            return (
              <Link
                key={item.key}
                href={item.url}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'min-h-[52px] min-w-[60px] rounded-xl px-3 py-2',
                  'active:opacity-60 transition-opacity duration-75'
                )}
              >
                {/* Active indicator — thin line at top */}
                {isActive && (
                  <div className='absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary' />
                )}

                <IconComponent
                  className={cn(
                    'h-[22px] w-[22px]',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />

                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
