'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';

export default function OrientationOverlay() {
  const t = useTranslations('Orientation');
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    function check() {
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      setIsPortrait(portrait);
    }

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className='bg-background/95 fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 text-center backdrop-blur-xl'>
      <RotateCcw className='text-primary animate-spin-slow mb-6 h-16 w-16' />

      <h2 className='mb-2 text-2xl font-bold'>{t('rotateTitle')}</h2>

      <p className='text-muted-foreground max-w-sm text-sm'>
        {t('rotateMessage')}
      </p>
    </div>
  );
}
