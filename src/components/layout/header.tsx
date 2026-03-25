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
    <header className='sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/85 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12' style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)', backdropFilter: 'blur(20px) saturate(180%)' }}>
      {/* Left Section: Navigation */}
      <div className='flex items-center gap-2 px-3 sm:px-4'>
        {/* Sidebar Toggle nur auf sehr großen Desktops */}
        <div className='hidden 2xl:flex 2xl:items-center 2xl:gap-2'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 h-4' />
        </div>

        {/* Breadcrumbs */}
        <Breadcrumbs />
      </div>

      {/* Right Section: User + Theme */}
      <div className='flex items-center gap-1 px-3 sm:gap-2 sm:px-4'>
        <UserNav />
        <ModeToggle />
        <ThemeSelector />
      </div>
    </header>
  );
}
