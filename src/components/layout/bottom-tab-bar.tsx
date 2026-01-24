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

  // Hauptnavigationspunkte filtern
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

  // Maximal 5 Hauptitems für Bottom Bar (iOS Standard)
  const displayItems = mainItems.slice(0, 5);

  return (
    <>
      {/* Spacer um Content nicht zu verdecken */}
      <div className='h-20 md:h-24' />

      {/* iOS Bottom Tab Bar */}
      <nav className='fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom'>
        {/* Glasmorphismus Container */}
        <div className='relative'>
          {/* Backdrop Blur Layer */}
          <div className='absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-border/50' />

          {/* Content Layer */}
          <div className='relative'>
            {/* Tab Container */}
            <div className='flex items-center justify-around px-2 py-2 md:px-4 md:py-3'>
              {displayItems.map((item) => {
                const IconComponent = Icons[item.icon] ?? Icons.logo;

                // Prüfen ob aktiv (Hauptseite oder Unterseite)
                const isActive =
                  pathname === item.url ||
                  (item.items?.some((sub) => pathname === sub.url) ?? false);

                return (
                  <Link
                    key={item.key}
                    href={item.url}
                    className={cn(
                      'group relative flex flex-col items-center justify-center gap-1',
                      'min-w-[60px] rounded-2xl px-4 py-2.5 transition-all duration-300',
                      'hover:scale-105 active:scale-95',
                      'md:min-w-[80px] md:px-6 md:py-3'
                    )}
                  >
                    {/* Active Background Pill */}
                    {isActive && (
                      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/30' />
                    )}

                    {/* Icon Container */}
                    <div className='relative z-10'>
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300',
                          'md:h-8 md:w-8',
                          isActive
                            ? 'scale-110'
                            : 'group-hover:scale-110'
                        )}
                      >
                        <IconComponent
                          className={cn(
                            'h-5 w-5 transition-all duration-300 md:h-6 md:w-6',
                            isActive
                              ? 'text-primary drop-shadow-sm'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'relative z-10 text-[10px] font-semibold transition-all duration-300 md:text-xs',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active Indicator Dot */}
                    {isActive && (
                      <div className='absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary shadow-sm shadow-primary/50' />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Copyright & iOS Home Indicator */}
          <div className='flex flex-col items-center gap-1 pb-2'>
            <p className='text-[9px] text-muted-foreground/60 font-medium tracking-wide'>
              Smart Inventory 2026 - Programmed by Alexander T.
            </p>
            <div className='h-1 w-32 rounded-full bg-foreground/20' />
          </div>
        </div>
      </nav>
    </>
  );
}
