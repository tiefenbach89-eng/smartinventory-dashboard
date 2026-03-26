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

      {/* Midnight Pro Bottom Tab Bar */}
      <nav
        className='fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-2xl'
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Subtle top gradient line */}
        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent' />

        <div className='flex items-center justify-around px-2 py-1.5'>
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
                  'relative flex flex-col items-center justify-center gap-1',
                  'min-h-[52px] min-w-[56px] rounded-xl px-3 py-2',
                  'active:scale-95 transition-transform duration-75'
                )}
              >
                {/* Active pill background */}
                {isActive && (
                  <span className='absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/15' />
                )}

                {/* Active indicator — top bar */}
                {isActive && (
                  <span className='absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary' />
                )}

                <IconComponent
                  className={cn(
                    'relative h-[21px] w-[21px] transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />

                <span
                  className={cn(
                    'relative text-[10px] font-semibold transition-colors',
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
