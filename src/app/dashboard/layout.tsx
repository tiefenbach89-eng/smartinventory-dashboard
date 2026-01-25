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
  return (
    <SidebarProvider defaultOpen={false}>
      {/* Desktop only: Sidebar (hidden on tablets and phones) */}
      <div className='hidden lg:block'>
        <AppSidebar />
      </div>

      <SidebarInset>
        {/* Header - angepasst für alle Geräte */}
        <Header />

        {/* ⬇️ Querformat-Only Overlay */}
        <OrientationOverlay />

        {/* Main Content */}
        {children}

        {/* Tablets & Mobile: Bottom Tab Bar (hidden on desktop) */}
        <div className='lg:hidden'>
          <BottomTabBar />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
