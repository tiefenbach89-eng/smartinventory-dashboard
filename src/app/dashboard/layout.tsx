'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import BottomTabBar from '@/components/layout/bottom-tab-bar';

// ⬇️ Neu: Querformat-Overlay importieren
import OrientationOverlay from '@/components/layout/orientation-overlay';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Sidebar: collapsed on tablets, expanded only on desktop xl+
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1280; // xl+ = expanded, otherwise collapsed
  });

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      {/* Tablet & Desktop: Sidebar (hidden only on phones < md) */}
      <div className='hidden md:block'>
        <AppSidebar />
      </div>

      <SidebarInset>
        {/* Header - angepasst für alle Geräte */}
        <Header />

        {/* ⬇️ Querformat-Only Overlay */}
        <OrientationOverlay />

        {/* Main Content */}
        {children}

        {/* Mobile only: Bottom Tab Bar (hidden on tablets md+ that have sidebar) */}
        <div className='md:hidden'>
          <BottomTabBar />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
