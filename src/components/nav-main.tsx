'use client';

import { IconChevronRight } from '@tabler/icons-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { Icon } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type NavMainItem = {
  key: string;
  title?: string;
  url: string;
  icon?: Icon;
  isActive?: boolean;
  items?: {
    key: string;
    title?: string;
    url: string;
  }[];
};

export function NavMain({ items }: { items: NavMainItem[] }) {
  const t = useTranslations('nav');

  return (
    <SidebarGroup>
      <SidebarGroupLabel className='text-muted-foreground/80 text-xs font-semibold tracking-wide uppercase'>
        {t('platform')}
      </SidebarGroupLabel>

      <SidebarGroupContent className='mt-1 flex flex-col gap-1'>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = !!item.items?.length;
            const label = t(item.key);

            // 🔹 Einfacher Button-Style für Hauptpunkte
            const buttonClass = cn(
              'min-h-[44px] min-w-8 justify-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium',
              'text-muted-foreground hover:text-foreground hover:bg-accent/70',
              'active:scale-[0.97] active:bg-accent/90',
              'transition-colors duration-150',
              item.isActive && [
                'bg-primary/10 text-primary',
                'border border-primary/20 shadow-sm'
              ]
            );

            if (!hasChildren) {
              // 👉 Einfache Einträge (Overview, Accounts usw.)
              return (
                <SidebarMenuItem key={item.key} className='px-1'>
                  <SidebarMenuButton
                    asChild
                    tooltip={label}
                    className={buttonClass}
                  >
                    <a href={item.url}>
                      {item.icon && <item.icon className='h-4 w-4' />}
                      <span className='truncate'>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // 👉 Einträge MIT Sub-Menü (Products)
            return (
              <Collapsible
                key={item.key}
                asChild
                defaultOpen={item.isActive}
                className='group/collapsible'
              >
                <SidebarMenuItem className='px-1'>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={label} className={buttonClass}>
                      {item.icon && <item.icon className='h-4 w-4' />}
                      <span className='truncate'>{label}</span>
                      <IconChevronRight className='text-muted-foreground ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent className='mt-1 pl-2'>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.key}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              'rounded-lg px-3 py-1.5 text-xs',
                              'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                              'transition-colors duration-150'
                            )}
                          >
                            <a href={subItem.url}>
                              <span className='truncate'>{t(subItem.key)}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
