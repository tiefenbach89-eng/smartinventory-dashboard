import React from 'react';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <div
      className='mx-auto w-full max-w-screen-2xl flex-1 pb-[env(safe-area-inset-bottom)]'
    >
      {children}
    </div>
  );
}
