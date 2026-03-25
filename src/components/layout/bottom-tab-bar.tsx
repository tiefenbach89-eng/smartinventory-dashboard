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
      {/* Spacer — muss Bottom Tab Bar + safe area abdecken */}
      <div className='h-[calc(72px+env(safe-area-inset-bottom))] md:h-[calc(84px+env(safe-area-inset-bottom))]' />

      {/* iOS Bottom Tab Bar */}
      <nav className='fixed bottom-0 left-0 right-0 z-50' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Glasmorphismus Container */}
        <div className='relative'>
          {/* Backdrop Blur Layer */}
          <div className='absolute inset-0 bg-background/85 backdrop-blur-2xl border-t border-border/40' style={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)', backdropFilter: 'blur(24px) saturate(180%)' }} />

          {/* Content Layer */}
          <div className='relative'>
            {/* Tab Container */}
            <div className='flex items-center justify-around px-2 py-1.5 md:px-4 md:py-2'>
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
                      'group relative flex flex-col items-center justify-center gap-0.5',
                      'min-h-[52px] min-w-[56px] rounded-2xl px-3 py-2',
                      'active:scale-90 transition-transform duration-100',
                      'md:min-w-[72px] md:px-5 md:py-2.5'
                    )}
                  >
                    {/* Active Background Pill — Amber Gold */}
                    {isActive && (
                      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 ring-1 ring-primary/30' style={{ boxShadow: '0 2px 12px var(--amber-glow)' }} />
                    )}

                    {/* Icon Container */}
                    <div className='relative z-10'>
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-xl',
                          'md:h-8 md:w-8',
                          isActive ? 'scale-110' : ''
                        )}
                      >
                        <IconComponent
                          className={cn(
                            'h-5 w-5 md:h-6 md:w-6',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'relative z-10 text-[10px] font-semibold md:text-xs',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>

                    {/* Active Indicator Dot — amber glow */}
                    {isActive && (
                      <div className='absolute -top-0.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-primary' style={{ boxShadow: '0 0 6px var(--amber-glow-strong)' }} />
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
