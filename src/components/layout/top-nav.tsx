'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { navItems } from '@/constants/nav-items.intl';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { UserNav } from './user-nav';
import { ModeToggle } from './ThemeToggle/theme-toggle';
import { ThemeSelector } from '../theme-selector';

function isAdminRoute(url?: string | null) {
  if (!url) return false;
  return url.startsWith('/dashboard/settings') || url.startsWith('/dashboard/accounts');
}

export default function TopNav() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const { permissions } = useRolePermissions();
  const canAccessAdmin = permissions?.can_access_admin_panel ?? false;

  const items = React.useMemo(() => {
    const base = navItems(t);
    if (canAccessAdmin) return base;
    return base.filter((item) => !isAdminRoute(item.url));
  }, [t, canAccessAdmin]);

  return (
    <header className='sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl'>
      <div className='mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8'>

        {/* ── Logo ── */}
        <Link
          href='/dashboard/overview'
          className='flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80'
        >
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary'>
            <span className='text-[10px] font-black tracking-tighter text-primary-foreground'>
              SI
            </span>
          </div>
          <span className='hidden text-sm font-semibold sm:block'>
            SmartInventory
          </span>
        </Link>

        {/* ── Desktop navigation links ── */}
        <nav className='hidden flex-1 items-center gap-0.5 lg:flex'>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.items?.some((sub) => pathname === sub.url) ?? false) ||
              (pathname.startsWith(item.url) && item.url !== '/dashboard/overview');

            return (
              <Link
                key={item.key}
                href={item.url}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right actions ── */}
        <div className='ml-auto flex items-center gap-0.5 lg:ml-0'>
          <UserNav />
          <ModeToggle />
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
