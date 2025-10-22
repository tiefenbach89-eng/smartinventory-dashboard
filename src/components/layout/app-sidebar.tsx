'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
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
  useSidebar // ✅ Hook importieren
} from '@/components/ui/sidebar';

import { Icons } from '@/components/icons';
import { navItems } from '@/constants/data';

export default function AppSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar(); // ✅ erkennt, ob Sidebar offen oder eingeklappt ist

  return (
    <Sidebar collapsible='icon'>
      {/* 🔹 Dynamischer Header */}
      <SidebarHeader>
        <div className='flex items-center justify-center px-3 py-2'>
          {open ? (
            <span className='text-muted-foreground text-sm font-semibold'>
              SmartInventory
            </span>
          ) : (
            <div className='flex items-center justify-center'>
              <div className='bg-primary text-primary-foreground shadow-primary/40 hover:shadow-primary/60 flex size-9 shrink-0 items-center justify-center rounded-full font-bold shadow-md transition-all hover:scale-105'>
                SI
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* 🔹 Menüinhalte */}
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>

          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;

              if (item?.items && item.items.length > 0) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={false}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={pathname === item.url}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === sub.url}
                              >
                                <Link href={sub.url}>
                                  <span>{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 👇 Damit das Icon-Only-Rail funktioniert */}
      <SidebarRail />
    </Sidebar>
  );
}
