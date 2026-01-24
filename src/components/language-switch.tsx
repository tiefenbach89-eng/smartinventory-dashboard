'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe2, ChevronDown } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ------------------------- Flags + Rotation ------------------------ */

const flagRotateStyle =
  'transition-transform duration-500 group-hover:rotate-[18deg]';

function FlagDE({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 512 512'
      className={cn('rounded-full', flagRotateStyle)}
    >
      <clipPath id='de-round'>
        <circle cx='256' cy='256' r='256' />
      </clipPath>
      <g clipPath='url(#de-round)'>
        <rect width='512' height='170.7' fill='#000' />
        <rect width='512' height='170.7' y='170.7' fill='#D00' />
        <rect width='512' height='170.7' y='341.3' fill='#FFCE00' />
      </g>
    </svg>
  );
}

function FlagUK({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 60 30'
      className={cn('rounded-full', flagRotateStyle)}
    >
      <clipPath id='uk'>
        <path d='M0,0 v30 h60 v-30 z' />
      </clipPath>
      <g clipPath='url(#uk)'>
        <rect width='60' height='30' fill='#012169' />
        <path d='M0,0 L60,30 M60,0 L0,30' stroke='#fff' strokeWidth='6' />
        <path d='M0,0 L60,30 M60,0 L0,30' stroke='#C8102E' strokeWidth='4' />
        <path d='M30,0 v30 M0,15 h60' stroke='#fff' strokeWidth='10' />
        <path d='M30,0 v30 M0,15 h60' stroke='#C8102E' strokeWidth='6' />
      </g>
    </svg>
  );
}

function FlagTR({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 512 512'
      className={cn('rounded-full', flagRotateStyle)}
    >
      <clipPath id='tr-round'>
        <circle cx='256' cy='256' r='256' />
      </clipPath>
      <g clipPath='url(#tr-round)'>
        <rect width='512' height='512' fill='#E30A17' />
        <circle cx='210' cy='256' r='90' fill='#fff' />
        <circle cx='230' cy='256' r='70' fill='#E30A17' />
        <polygon
          fill='#fff'
          points='310,256 348,273 335,233 368,205 325,205 310,166 295,205 252,205 285,233 272,273'
        />
      </g>
    </svg>
  );
}

/* ------------------------------ Language Config ------------------------------ */

const LANGS = [
  { code: 'de', short: 'DE', labelKey: 'de', flag: FlagDE },
  { code: 'en', short: 'EN', labelKey: 'en', flag: FlagUK },
  { code: 'tr', short: 'TR', labelKey: 'tr', flag: FlagTR }
];

/* ------------------------------ Component ------------------------------ */

export default function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations('LanguageSwitch');
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(locale);

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];
  const CurrentFlag = current.flag;

  const changeLanguage = () => {
    const selected = LANGS.find((l) => l.code === value) ?? current;

    document.cookie = `NEXT_LOCALE=${selected.code}; path=/; max-age=31536000`;

    setOpen(false);
    router.replace(pathname);
    router.refresh?.();
  };

  return (
    <>
      {/* Button (neutral für Light + Dark) */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-all'
      >
        <Globe2 className='h-3.5 w-3.5 opacity-80' />
        <CurrentFlag size={16} />
        <span>{current.short}</span>
        <ChevronDown className='h-3 w-3 opacity-70' />
      </button>

      {/* Dialog — jetzt Theme-ready */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-card border-border w-[90%] max-w-sm rounded-2xl border shadow-2xl backdrop-blur-xl'>
          <DialogHeader>
            <DialogTitle className='text-base font-semibold'>
              {t('title')}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              {t('description')}
            </DialogDescription>
          </DialogHeader>

          <div className='mt-3 space-y-2.5'>
            {LANGS.map((lang) => {
              const Flag = lang.flag;
              const isActive = value === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => setValue(lang.code)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm',
                    'bg-accent/30 border-border hover:bg-accent border shadow-sm transition-all',
                    isActive && 'bg-primary/15 border-primary'
                  )}
                >
                  <Flag size={22} />
                  <div className='flex flex-col'>
                    <span className='font-medium'>
                      {t(`languages.${lang.labelKey}`)}
                    </span>
                    <span className='text-[11px] opacity-60'>{lang.short}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button size='sm' onClick={changeLanguage}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
