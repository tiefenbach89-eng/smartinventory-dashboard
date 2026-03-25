'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type LowLiquid = {
  id: string;
  brand: string;
  viscosity: string | null;
  liquid_type: string;
  current_level: number;
  max_capacity: number;
  location: string | null;
  fill_percentage: number;
};

type LowProduct = {
  artikelnummer: string;
  artikelbezeichnung: string;
  bestand: number;
  sollbestand: number;
  lieferant: string | null;
  fill_percentage: number;
};

export function LiquidWarnings() {
  const t = useTranslations('overview');
  const router = useRouter();
  const [lowLiquids, setLowLiquids] = React.useState<LowLiquid[]>([]);
  const [lowProducts, setLowProducts] = React.useState<LowProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadLowLiquids();
    loadLowProducts();
  }, []);

  async function loadLowLiquids() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('barrel_oils')
        .select('id, brand, viscosity, liquid_type, current_level, max_capacity, location')
        .order('current_level', { ascending: true });

      if (error) throw error;

      if (data) {
        const withPercentage = data.map((item) => ({
          ...item,
          fill_percentage: (item.current_level / item.max_capacity) * 100
        }));
        setLowLiquids(withPercentage.filter((item) => item.fill_percentage < 30 && item.fill_percentage > 0));
      }
    } catch {
      // silently fail — non-critical widget
    } finally {
      setLoading(false);
    }
  }

  async function loadLowProducts() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('artikel')
        .select('artikelnummer, artikelbezeichnung, bestand, sollbestand, lieferant')
        .gt('sollbestand', 0)
        .order('bestand', { ascending: true });

      if (error) throw error;

      if (data) {
        setLowProducts(
          data
            .filter((item) => item.bestand <= item.sollbestand)
            .map((item) => ({
              ...item,
              fill_percentage: (item.bestand / item.sollbestand) * 100
            }))
        );
      }
    } catch {
      // silently fail — non-critical widget
    }
  }

  function getLiquidLabel(liquidType: string): string {
    if (liquidType === 'windshield_washer') return t('warningWasher');
    if (liquidType === 'distilled_water') return t('warningWater');
    return t('warningOil');
  }

  function getSeverityColor(percentage: number) {
    if (percentage < 10) return 'bg-red-500';
    if (percentage < 20) return 'bg-orange-500';
    return 'bg-amber-500';
  }

  function getSeverityIconClass(percentage: number) {
    if (percentage < 10) return 'bg-red-500/10 text-red-600 dark:text-red-400';
    if (percentage < 20) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  function getSeverityTextClass(percentage: number) {
    if (percentage < 10) return 'text-red-600 dark:text-red-400';
    if (percentage < 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-amber-600 dark:text-amber-400';
  }

  if (loading) return null;
  if (lowLiquids.length === 0 && lowProducts.length === 0) return null;

  return (
    <div className='space-y-3'>
      {/* Low Product Stock */}
      {lowProducts.length > 0 && (
        <Card className='rounded-xl border border-red-200/60 bg-card shadow-sm dark:border-red-900/30'>
          <CardHeader className='px-5 pb-3 pt-5'>
            <CardTitle className='flex items-center gap-2.5 text-base font-semibold'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400'>
                <IconAlertTriangle className='h-4 w-4' />
              </div>
              {t('warningProductsTitle')}
            </CardTitle>
            <CardDescription>
              {lowProducts.length} {t('warningProductsDesc')}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-2 px-5 pb-5'>
            {lowProducts.slice(0, 5).map((product) => (
              <div
                key={product.artikelnummer}
                className='rounded-lg border border-border/40 bg-muted/30 p-3'
              >
                <div className='flex items-start gap-3'>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', getSeverityIconClass(product.fill_percentage))}>
                    <IconAlertTriangle className='h-4 w-4' />
                  </div>
                  <div className='flex-1 space-y-1.5 min-w-0'>
                    <div className='flex items-baseline gap-2 flex-wrap'>
                      <span className='text-sm font-semibold leading-tight'>{product.artikelbezeichnung}</span>
                      <span className='text-muted-foreground text-xs font-mono'>#{product.artikelnummer}</span>
                    </div>
                    <div className='flex items-center gap-3 text-xs'>
                      {product.lieferant && (
                        <span className='text-muted-foreground'>{product.lieferant}</span>
                      )}
                      <span className={cn('font-semibold tabular-nums', getSeverityTextClass(product.fill_percentage))}>
                        {product.bestand} / {product.sollbestand} {t('warningPieces')}
                      </span>
                    </div>
                    <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className={cn('h-full transition-all duration-500', getSeverityColor(product.fill_percentage))}
                        style={{ width: `${Math.min(product.fill_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {lowProducts.length > 5 && (
              <Button
                variant='ghost'
                className='h-9 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground'
                onClick={() => router.push('/dashboard/product')}
              >
                {t('warningShowAllProducts')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Liquid Levels */}
      {lowLiquids.length > 0 && (
        <Card className='rounded-xl border border-amber-200/60 bg-card shadow-sm dark:border-amber-900/30'>
          <CardHeader className='px-5 pb-3 pt-5'>
            <CardTitle className='flex items-center gap-2.5 text-base font-semibold'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                <IconAlertTriangle className='h-4 w-4' />
              </div>
              {t('warningLiquidsTitle')}
            </CardTitle>
            <CardDescription>
              {lowLiquids.length} {t('warningLiquidsDesc')}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-2 px-5 pb-5'>
            {lowLiquids.map((liquid) => (
              <div
                key={liquid.id}
                className='rounded-lg border border-border/40 bg-muted/30 p-3'
              >
                <div className='flex items-start gap-3'>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', getSeverityIconClass(liquid.fill_percentage))}>
                    <IconAlertTriangle className='h-4 w-4' />
                  </div>
                  <div className='flex-1 space-y-1.5 min-w-0'>
                    <div className='flex items-baseline gap-2 flex-wrap'>
                      <span className='text-sm font-semibold leading-tight'>{liquid.brand}</span>
                      {liquid.liquid_type === 'oil' && liquid.viscosity && (
                        <span className='text-muted-foreground text-xs'>{liquid.viscosity}</span>
                      )}
                    </div>
                    <div className='flex items-center gap-3 text-xs flex-wrap'>
                      <span className='text-muted-foreground'>{getLiquidLabel(liquid.liquid_type)}</span>
                      <span className={cn('font-semibold tabular-nums', getSeverityTextClass(liquid.fill_percentage))}>
                        {liquid.current_level}L / {liquid.max_capacity}L
                      </span>
                      {liquid.location && (
                        <span className='text-muted-foreground'>{liquid.location}</span>
                      )}
                    </div>
                    <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className={cn('h-full transition-all duration-500', getSeverityColor(liquid.fill_percentage))}
                        style={{ width: `${liquid.fill_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {lowLiquids.length > 3 && (
              <Button
                variant='ghost'
                className='h-9 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground'
                onClick={() => router.push('/dashboard/barrel-oils')}
              >
                {t('warningShowAllLiquids')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
