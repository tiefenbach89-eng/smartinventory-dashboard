'use client';

import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { UserNav } from './user-nav';
import { ThemeSelector } from '../theme-selector';
import { ModeToggle } from './ThemeToggle/theme-toggle';

export default function Header() {
  return (
    <header className='sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/90 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11'>
      {/* Left: sidebar trigger + page location */}
      <div className='flex items-center gap-1.5 px-3 sm:px-4'>
        <SidebarTrigger className='hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground' />
        <Separator orientation='vertical' className='hidden lg:block mr-1 h-4 opacity-50' />
        <Breadcrumbs />
      </div>

      {/* Right: actions */}
      <div className='flex items-center gap-0.5 px-3 sm:px-4'>
        <UserNav />
        <ModeToggle />
        <ThemeSelector />
      </div>
    </header>
  );
}
