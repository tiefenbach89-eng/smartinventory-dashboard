'use client';

import { useEffect, useState } from 'react';
import { useThemeConfig } from '@/components/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';

const DEFAULT_THEMES = [
  { key: 'default', value: 'default' },
  { key: 'blue', value: 'blue' },
  { key: 'green', value: 'green' },
  { key: 'amber', value: 'amber' }
];

const SCALED_THEMES = [
  { key: 'defaultScaled', value: 'default-scaled' },
  { key: 'blueScaled', value: 'blue-scaled' }
];

const MONO_THEMES = [{ key: 'mono', value: 'mono-scaled' }];

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('themeSelector');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ✅ verhindert Hydration-Mismatch

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        {t('label')}
      </Label>

      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id='theme-selector'
          className='justify-start *:data-[slot=select-value]:w-12'
        >
          <span className='text-muted-foreground hidden sm:block'>
            {t('selectPrefixDesktop')}
          </span>
          <span className='text-muted-foreground block sm:hidden'>
            {t('selectPrefixMobile')}
          </span>
          <SelectValue placeholder={t('placeholder')} />
        </SelectTrigger>

        <SelectContent align='end'>
          <SelectGroup>
            <SelectLabel>{t('groupDefault')}</SelectLabel>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {t(`names.${theme.key}`)}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectSeparator />

          <SelectGroup>
            <SelectLabel>{t('groupScaled')}</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {t(`names.${theme.key}`)}
              </SelectItem>
            ))}
          </SelectGroup>

          <SelectGroup>
            <SelectLabel>{t('groupMono')}</SelectLabel>
            {MONO_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {t(`names.${theme.key}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
