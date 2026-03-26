'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  const items = React.useMemo(() => {
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
    <Sidebar collapsible='icon' className='border-r border-border bg-sidebar'>

      {/* ── Header — clean wordmark, no decoration ── */}
      <SidebarHeader className='border-b border-border px-4 py-4'>
        <div className='flex items-center gap-2.5'>
          {/* Logo mark — flat square, no gradient */}
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary'>
            <span className='text-[11px] font-black text-primary-foreground tracking-tight'>
              {t('short')}
            </span>
          </div>
          {open && (
            <div className='flex flex-col leading-tight'>
              <span className='text-sm font-semibold text-foreground'>
                {t('title')}
              </span>
              <span className='text-[11px] text-muted-foreground'>
                {t('dashboardLabel')}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ── Navigation — Linear-style flat rows ── */}
      <SidebarContent className='overflow-x-hidden overflow-y-auto px-2 py-3'>
        <SidebarGroup>
          <SidebarMenu className='space-y-0.5'>
            {items.map((item) => {
              const IconComponent = Icons[item.icon] ?? Icons.logo;
              const hasChildren = !!item.items && item.items.length > 0;

              const isActive =
                pathname === item.url ||
                (item.items?.some((sub) => pathname === sub.url) ?? false);

              // Icon-only (collapsed) mode
              if (!open) {
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                      onClick={() => router.push(item.url)}
                    >
                      <IconComponent className='h-5 w-5' />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Items with children — expandable
              if (hasChildren) {
                const isOpen = !!openMap[item.key];

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive}
                      className={cn(
                        'h-9 w-full rounded-lg px-3 transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <button
                        type='button'
                        className='flex w-full items-center gap-2.5'
                        onClick={() => toggle(item.key)}
                      >
                        <IconComponent className='h-4.5 w-4.5 shrink-0' />
                        <span className='flex-1 truncate text-sm'>{item.label}</span>
                        <Icons.chevronRight
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-200',
                            isOpen && 'rotate-90'
                          )}
                        />
                      </button>
                    </SidebarMenuButton>

                    {/* Submenu — smooth expand */}
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
                        isOpen ? 'mt-0.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      )}
                    >
                      <div className='overflow-hidden'>
                        <SidebarMenuSub className='ml-4 space-y-0.5 border-l border-border py-1 pl-3'>
                          {item.items!.map((sub) => (
                            <SidebarMenuSubItem key={sub.key}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.url}
                                className={cn(
                                  'h-8 rounded-md px-3 text-sm transition-colors',
                                  pathname === sub.url
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                )}
                              >
                                <Link href={sub.url}>{sub.label}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </div>
                    </div>
                  </SidebarMenuItem>
                );
              }

              // Regular items
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={cn(
                      'h-9 rounded-lg px-3 transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Link href={item.url} className='flex items-center gap-2.5'>
                      <IconComponent className='h-4.5 w-4.5 shrink-0' />
                      <span className='truncate text-sm'>{item.label}</span>
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
