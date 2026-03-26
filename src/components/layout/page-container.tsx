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
      className='mx-auto w-full max-w-screen-xl flex-1 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 md:px-8 lg:px-10 lg:py-8'
    >
      {children}
    </div>
  );
}
