import * as React from 'react';
import TopNav from '@/components/layout/top-nav';
import BottomTabBar from '@/components/layout/bottom-tab-bar';
import OrientationOverlay from '@/components/layout/orientation-overlay';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-dvh flex-col bg-background'>
      {/* Top navigation — visible on all screen sizes */}
      <TopNav />

      {/* Orientation lock overlay (landscape phones) */}
      <OrientationOverlay />

      {/* Main content — full width, no sidebar offset */}
      <main className='flex flex-1 flex-col'>
        {children}
      </main>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <div className='lg:hidden'>
        <BottomTabBar />
      </div>
    </div>
  );
}
