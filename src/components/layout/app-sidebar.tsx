'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';

import { Icons } from '@/components/icons';
import { navItems } from '@/constants/nav-items.intl';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRolePermissions } from '@/hooks/useRolePermissions';

function isAdminRoute(url?: string | null) {
  if (!url) return false;
  // hier kannst du bei Bedarf weitere Admin-Routen ergänzen
  return (
    url.startsWith('/dashboard/settings') ||
    url.startsWith('/dashboard/accounts')
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const t = useTranslations('Sidebar');

  const { permissions } = useRolePermissions();
  const canAccessAdmin = permissions?.can_access_admin_panel ?? false;

  // Map: welcher Menüpunkt ist aufgeklappt
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  // NavItems, gefiltert nach Berechtigungen
  const items = React.useMemo(() => {
    const base = navItems(t);

    if (canAccessAdmin) return base;

    // Employee: Admin-/Settings-Routen ausblenden
    return base
      .map((item) => {
        const filteredSubs = item.items?.filter(
          (sub) => !isAdminRoute(sub.url)
        );

        // wenn der Hauptlink selbst eine Admin-Route ist → Item komplett raus
        if (isAdminRoute(item.url)) {
          // falls keine Unterpunkte übrig bleiben, Item weg
          if (!filteredSubs || filteredSubs.length === 0) return null;
        }

        // wenn alle Unterpunkte Admin sind → ganzes Item raus
        if (item.items && (!filteredSubs || filteredSubs.length === 0)) {
          return isAdminRoute(item.url) ? null : { ...item, items: [] };
        }

        return { ...item, items: filteredSubs };
      })
      .filter(Boolean) as ReturnType<typeof navItems>;
  }, [t, canAccessAdmin]);

  // Aktive Gruppe beim Page-Load automatisch öffnen
  React.useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };

      items.forEach((item) => {
        if (item.items?.some((sub) => pathname === sub.url)) {
          next[item.key] = true;
        }
      });

      return next;
    });
  }, [pathname, items]);

  function toggle(key: string) {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Sidebar
      collapsible='icon'
      className='transition-[width] duration-300 ease-in-out backdrop-blur-xl bg-gradient-to-b from-background/95 via-background/90 to-background/95 border-r border-border/50 safe-area-inset-left'
    >
      {/* iOS-Style Header mit Glasmorphismus */}
      <SidebarHeader className='border-b border-border/30 px-4 py-4 backdrop-blur-xl'>
        <div className='flex items-center justify-center'>
          {open ? (
            <div className='flex items-center gap-3 transition-all duration-300'>
              <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/20 ring-1 ring-primary/20'>
                <span className='text-lg font-black tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent'>
                  {t('short')}
                </span>
              </div>
              <div className='flex flex-col'>
                <span className='text-base font-bold tracking-tight'>
                  {t('title')}
                </span>
                <span className='text-muted-foreground text-xs font-medium'>
                  {t('dashboardLabel')}
                </span>
              </div>
            </div>
          ) : (
            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/20 ring-1 ring-primary/20 transition-all duration-300'>
              <span className='text-sm font-black tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent'>
                {t('short')}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* iOS-Style Navigation mit Cards */}
      <SidebarContent className='overflow-x-hidden overflow-y-auto px-2 py-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='text-muted-foreground/70 px-2 pb-2 pt-1 text-[10px] font-bold tracking-widest uppercase'>
            {t('group_overview')}
          </SidebarGroupLabel>

          <SidebarMenu className='space-y-2 px-1'>
            {items.map((item) => {
              const IconComponent = Icons[item.icon] ?? Icons.logo;
              const hasChildren = !!item.items && item.items.length > 0;

              const isActive =
                pathname === item.url ||
                (item.items?.some((sub) => pathname === sub.url) ?? false);

              const buttonClass = cn(
                'group relative min-w-8 justify-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold',
                'backdrop-blur-sm transition-all duration-300 ease-out',
                'hover:scale-[1.02] active:scale-[0.98]',
                // Inactive State - iOS Card Style
                !isActive && [
                  'bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10',
                  'text-muted-foreground hover:text-foreground',
                  'shadow-sm hover:shadow-md',
                  'ring-1 ring-border/20 hover:ring-border/40',
                ],
                // Active State - iOS Gradient
                isActive && [
                  'bg-gradient-to-br from-primary via-primary/90 to-primary/80',
                  'text-primary-foreground',
                  'shadow-lg shadow-primary/30',
                  'ring-1 ring-primary/50',
                ]
              );

              // Icon-only Mode: Touch-optimierte Buttons
              if (hasChildren && !open) {
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive}
                      className={buttonClass}
                      onClick={() => router.push(item.url)}
                    >
                      <IconComponent className='h-5 w-5 transition-transform duration-300 group-hover:scale-110' />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Items mit Unterpunkten – iOS-Style Expansion
              if (hasChildren) {
                const isOpen = !!openMap[item.key];

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive}
                      className={buttonClass}
                    >
                      <button
                        type='button'
                        className='flex w-full items-center'
                        onClick={() => toggle(item.key)}
                      >
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                          isActive
                            ? 'bg-white/20 shadow-inner'
                            : 'bg-background/40 group-hover:bg-background/60'
                        )}>
                          <IconComponent className='h-5 w-5 transition-transform duration-300 group-hover:scale-110' />
                        </div>
                        <span className='truncate font-semibold'>{item.label}</span>
                        <Icons.chevronRight
                          className={cn(
                            'ml-auto h-4 w-4 transition-all duration-300',
                            isOpen && 'rotate-90',
                            isActive ? 'opacity-80' : 'opacity-50 group-hover:opacity-100'
                          )}
                        />
                      </button>
                    </SidebarMenuButton>

                    {/* iOS-Style Smooth Dropdown mit Cards */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-400 ease-in-out',
                        'transform',
                        isOpen
                          ? 'mt-2 max-h-[600px] translate-y-0 opacity-100'
                          : 'max-h-0 -translate-y-2 opacity-0'
                      )}
                    >
                      <SidebarMenuSub className='space-y-1.5 rounded-2xl bg-background/40 p-2 backdrop-blur-sm ring-1 ring-border/20'>
                        {item.items!.map((sub) => (
                          <SidebarMenuSubItem key={sub.key}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === sub.url}
                              className={cn(
                                'rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                pathname === sub.url
                                  ? 'bg-primary/20 text-primary ring-1 ring-primary/30 shadow-sm'
                                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                              )}
                            >
                              <Link href={sub.url} className='flex items-center gap-2'>
                                <div className={cn(
                                  'h-1.5 w-1.5 rounded-full transition-all duration-200',
                                  pathname === sub.url
                                    ? 'bg-primary shadow-sm shadow-primary/50'
                                    : 'bg-muted-foreground/30'
                                )} />
                                <span className='truncate'>{sub.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </div>
                  </SidebarMenuItem>
                );
              }

              // Normale Items ohne Unterpunkte - iOS Cards
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={buttonClass}
                  >
                    <Link href={item.url}>
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-white/20 shadow-inner'
                          : 'bg-background/40 group-hover:bg-background/60'
                      )}>
                        <IconComponent className='h-5 w-5 transition-transform duration-300 group-hover:scale-110' />
                      </div>
                      <span className='truncate font-semibold'>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
