'use client';

import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

export default function AccessDeniedPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const t = useTranslations('AccessDenied');

  const handleRedirect = (path: string) => {
    setVisible(false);
    setTimeout(() => router.push(path), 400);
  };

  return (
    <main className='bg-background flex h-screen flex-col items-center justify-center px-6 text-center'>
      <AnimatePresence mode='wait'>
        {visible && (
          <motion.div
            key='access-denied'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='max-w-md'
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className='mb-6 flex justify-center'
            >
              <div className='bg-primary/10 text-primary rounded-full p-4 shadow-sm'>
                <ShieldAlert className='h-12 w-12' />
              </div>
            </motion.div>

            {/* Text */}
            <h1 className='text-foreground mb-2 text-6xl font-bold'>
              {t('code')}
            </h1>
            <h2 className='text-foreground mb-3 text-2xl font-semibold'>
              {t('title')}
            </h2>
            <p className='text-muted-foreground mb-8'>{t('description')}</p>

            {/* Buttons */}
            <div className='flex justify-center'>
              <Button
                variant='default'
                className='px-6 py-2'
                onClick={() => handleRedirect('/dashboard/overview')}
              >
                {t('back')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
