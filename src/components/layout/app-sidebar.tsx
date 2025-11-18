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

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const t = useTranslations('Sidebar');

  // Map: welcher Menüpunkt ist aufgeklappt
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  // Aktive Gruppe beim Page-Load automatisch öffnen
  React.useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };

      navItems(t).forEach((item) => {
        if (item.items?.some((sub) => pathname === sub.url)) {
          next[item.key] = true;
        }
      });

      return next;
    });
  }, [pathname, t]);

  function toggle(key: string) {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Sidebar
      collapsible='icon'
      className='transition-[width] duration-300 ease-in-out'
    >
      {/* Header */}
      <SidebarHeader className='border-border/40 border-b px-3 py-3'>
        <div className='flex items-center justify-center'>
          {open ? (
            <div className='flex items-baseline gap-2 transition-opacity duration-300'>
              <span className='text-sm font-semibold tracking-tight'>
                {t('title')}
              </span>
              <span className='text-muted-foreground text-xs'>Dashboard</span>
            </div>
          ) : (
            <div className='border-border/60 text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-semibold tracking-tight transition-all duration-300'>
              {t('short')}
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel className='text-muted-foreground/80 px-3 text-[11px] font-semibold tracking-wide uppercase'>
            {t('group_overview')}
          </SidebarGroupLabel>

          <SidebarMenu className='mt-1 space-y-1 px-1'>
            {navItems(t).map((item) => {
              const IconComponent = Icons[item.icon] ?? Icons.logo;
              const hasChildren = !!item.items && item.items.length > 0;

              const isActive =
                pathname === item.url ||
                (item.items?.some((sub) => pathname === sub.url) ?? false);

              const buttonClass = cn(
                'min-w-8 justify-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium',
                'text-muted-foreground hover:text-foreground hover:bg-accent/70',
                'transition-all duration-200 ease-out',
                'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
                'data-[active=true]:border data-[active=true]:border-primary/40'
              );

              // Icon-only Mode: Direkt zur Hauptseite (kein Dropdown)
              if (hasChildren && !open) {
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive}
                      className={buttonClass}
                      onClick={() => router.push(item.url)}
                    >
                      <IconComponent className='h-4 w-4' />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Items mit Unterpunkten – eigener smooth Collapsible
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
                        <IconComponent className='h-4 w-4' />
                        <span className='truncate'>{item.label}</span>
                        <Icons.chevronRight
                          className={cn(
                            'text-muted-foreground ml-auto h-3 w-3 transition-transform duration-300',
                            isOpen && 'rotate-90'
                          )}
                        />
                      </button>
                    </SidebarMenuButton>

                    {/* Smooth Dropdown */}
                    <div
                      className={cn(
                        'mt-1 overflow-hidden pl-2 transition-all duration-300 ease-in-out',
                        'transform',
                        isOpen
                          ? 'max-h-[500px] translate-y-0 opacity-100'
                          : 'max-h-0 -translate-y-1 opacity-0'
                      )}
                    >
                      <SidebarMenuSub className='mt-1'>
                        {item.items!.map((sub) => (
                          <SidebarMenuSubItem key={sub.key}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === sub.url}
                              className='text-muted-foreground hover:bg-accent/60 hover:text-foreground rounded-lg px-3 py-1.5 text-xs transition-colors'
                            >
                              <Link href={sub.url}>
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

              // Normale Items ohne Unterpunkte
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={buttonClass}
                  >
                    <Link href={item.url}>
                      <IconComponent className='h-4 w-4' />
                      <span className='truncate'>{item.label}</span>
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
