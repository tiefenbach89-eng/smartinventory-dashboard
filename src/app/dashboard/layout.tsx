'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';

// ⬇️ Neu: Querformat-Overlay importieren
import OrientationOverlay from '@/components/layout/orientation-overlay';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Header />

        {/* ⬇️ Querformat-Only Overlay */}
        <OrientationOverlay />

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
