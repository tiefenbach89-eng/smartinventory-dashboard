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
    <header className='sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl'>
      {/* Subtle indigo gradient line at top */}
      <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent' />

      <div className='mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8'>

        {/* ── Logo ── */}
        <Link
          href='/dashboard/overview'
          className='group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90'
        >
          <div className='relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/25'>
            <span className='text-[10px] font-black tracking-tighter text-primary-foreground'>
              SI
            </span>
            <div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent' />
          </div>
          <span className='hidden text-sm font-bold tracking-tight sm:block'>
            <span className='bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
              Smart
            </span>
            <span className='bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
              Inventory
            </span>
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
                  'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {/* Active underline indicator */}
                {isActive && (
                  <span className='absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary/70' />
                )}
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
