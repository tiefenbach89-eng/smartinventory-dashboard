'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconDroplet, IconTrendingDown } from '@tabler/icons-react';
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
    console.log('🚀 [LiquidWarnings] Komponente geladen, starte Datenabfrage...');
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
        console.log('🔍 [LiquidWarnings] Alle Flüssigkeiten:', data);

        // Berechne Füllstand und filtere unter 30%
        const withPercentage = data.map((item) => ({
          ...item,
          fill_percentage: (item.current_level / item.max_capacity) * 100
        }));

        console.log('📊 [LiquidWarnings] Mit Prozentwerten:', withPercentage);

        const filtered = withPercentage.filter((item) => item.fill_percentage < 30 && item.fill_percentage > 0);

        console.log('⚠️ [LiquidWarnings] Gefiltert (< 30%):', filtered);

        setLowLiquids(filtered);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Flüssigkeiten:', error);
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
        // Filtere Produkte mit Bestand <= Sollbestand
        const lowStock = data
          .filter((item) => item.bestand <= item.sollbestand)
          .map((item) => ({
            ...item,
            fill_percentage: (item.bestand / item.sollbestand) * 100
          }));

        setLowProducts(lowStock);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Produkte:', error);
    }
  }

  function getLiquidLabel(liquidType: string): string {
    if (liquidType === 'windshield_washer') return 'Wischwasser';
    if (liquidType === 'distilled_water') return 'Destilliertes Wasser';
    return 'Öl';
  }

  function getSeverityColor(percentage: number) {
    if (percentage < 10) return 'from-red-500/20 via-red-500/10 to-red-500/5 border-red-500/50';
    if (percentage < 20) return 'from-orange-500/20 via-orange-500/10 to-orange-500/5 border-orange-500/50';
    return 'from-amber-500/20 via-amber-500/10 to-amber-500/5 border-amber-500/50';
  }

  function getSeverityIcon(percentage: number) {
    if (percentage < 10) return 'text-red-500';
    if (percentage < 20) return 'text-orange-500';
    return 'text-amber-500';
  }

  if (loading) {
    return null; // Kein Ladeindikator, um Flackern zu vermeiden
  }

  if (lowLiquids.length === 0 && lowProducts.length === 0) {
    return null; // Keine Anzeige wenn alles OK ist
  }

  return (
    <>
    {/* Niedrige Produktbestände */}
    {lowProducts.length > 0 && (
      <Card className='group relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl'>
        <div className='absolute inset-0 -z-10 opacity-[0.02]'>
          <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
        </div>
        <div className='absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
          <div className='absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10' />
        </div>

        <CardHeader className='space-y-3 p-6'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-xl font-black'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 shadow-inner backdrop-blur-sm'>
                <IconAlertTriangle className='h-5 w-5' />
              </div>
              Niedrige Produktbestände
            </CardTitle>
          </div>
          <CardDescription className='text-sm font-semibold'>
            {lowProducts.length} {lowProducts.length === 1 ? 'Produkt' : 'Produkte'} unter Mindestbestand - Nachbestellung empfohlen
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 px-6 pb-6'>
          {lowProducts.slice(0, 5).map((product) => (
            <div
              key={product.artikelnummer}
              className='relative overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-br from-background/50 to-secondary/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-border/40 hover:shadow-lg'
            >
              <div className='flex items-start gap-3'>
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
                  product.fill_percentage < 33 && 'bg-red-500/10 text-red-500',
                  product.fill_percentage >= 33 && product.fill_percentage < 66 && 'bg-orange-500/10 text-orange-500',
                  product.fill_percentage >= 66 && 'bg-amber-500/10 text-amber-500'
                )}>
                  <IconAlertTriangle className='h-5 w-5' />
                </div>
                <div className='flex-1 space-y-2'>
                  <div className='font-bold'>
                    {product.artikelbezeichnung}
                    <span className='text-muted-foreground ml-2 text-sm font-medium'>
                      #{product.artikelnummer}
                    </span>
                  </div>
                  <div className='flex flex-wrap items-center gap-2 text-xs'>
                    {product.lieferant && (
                      <span className='rounded-lg bg-primary/10 px-2 py-1 font-medium'>
                        {product.lieferant}
                      </span>
                    )}
                    <span className={cn('font-bold',
                      product.fill_percentage < 33 && 'text-red-500',
                      product.fill_percentage >= 33 && product.fill_percentage < 66 && 'text-orange-500',
                      product.fill_percentage >= 66 && 'text-amber-500'
                    )}>
                      {product.fill_percentage.toFixed(0)}%
                    </span>
                    <span className='text-muted-foreground'>
                      {product.bestand} / {product.sollbestand} Stück
                    </span>
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-background/60'>
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        product.fill_percentage < 33 && 'bg-gradient-to-r from-red-500 to-red-600',
                        product.fill_percentage >= 33 && product.fill_percentage < 66 && 'bg-gradient-to-r from-orange-500 to-orange-600',
                        product.fill_percentage >= 66 && 'bg-gradient-to-r from-amber-500 to-amber-600'
                      )}
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
              className='w-full rounded-xl font-semibold'
              onClick={() => router.push('/dashboard/product')}
            >
              Alle Produkte anzeigen →
            </Button>
          )}
        </CardContent>
      </Card>
    )}

    {/* Niedrige Flüssigkeitsstände */}
    {lowLiquids.length > 0 && (
    <Card className='group relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl'>
      {/* Subtle Pattern */}
      <div className='absolute inset-0 -z-10 opacity-[0.02]'>
        <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
      </div>

      {/* Gradient Overlay on Hover */}
      <div className='absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
        <div className='absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10' />
      </div>

      <CardHeader className='space-y-3 p-6'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-xl font-black'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-inner backdrop-blur-sm'>
              <IconAlertTriangle className='h-5 w-5' />
            </div>
            Niedrige Flüssigkeitsstände
          </CardTitle>
        </div>
        <CardDescription className='text-sm font-semibold'>
          {lowLiquids.length} {lowLiquids.length === 1 ? 'Flüssigkeit' : 'Flüssigkeiten'} unter 30% - Nachbestellung empfohlen
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 px-6 pb-6'>
        {lowLiquids.map((liquid) => (
          <div
            key={liquid.id}
            className='relative overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-br from-background/50 to-secondary/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:border-border/40 hover:shadow-lg'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-1 items-start gap-3'>
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
                  liquid.fill_percentage < 10 && 'bg-red-500/10 text-red-500',
                  liquid.fill_percentage >= 10 && liquid.fill_percentage < 20 && 'bg-orange-500/10 text-orange-500',
                  liquid.fill_percentage >= 20 && 'bg-amber-500/10 text-amber-500'
                )}>
                  <IconAlertTriangle className='h-5 w-5' />
                </div>
                <div className='flex-1 space-y-2'>
                  <div className='font-bold'>
                    {liquid.brand}
                    {liquid.liquid_type === 'oil' && liquid.viscosity && (
                      <span className='text-muted-foreground ml-2 text-sm font-medium'>
                        {liquid.viscosity}
                      </span>
                    )}
                  </div>
                  <div className='flex flex-wrap items-center gap-2 text-xs'>
                    <span className='rounded-lg bg-primary/10 px-2 py-1 font-medium'>
                      {getLiquidLabel(liquid.liquid_type)}
                    </span>
                    <span className={cn('font-bold', getSeverityIcon(liquid.fill_percentage))}>
                      {liquid.fill_percentage.toFixed(1)}%
                    </span>
                    <span className='text-muted-foreground'>
                      {liquid.current_level}L / {liquid.max_capacity}L
                    </span>
                    {liquid.location && (
                      <span className='text-muted-foreground'>📍 {liquid.location}</span>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className='h-2 w-full overflow-hidden rounded-full bg-background/60'>
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        liquid.fill_percentage < 10 && 'bg-gradient-to-r from-red-500 to-red-600',
                        liquid.fill_percentage >= 10 && liquid.fill_percentage < 20 && 'bg-gradient-to-r from-orange-500 to-orange-600',
                        liquid.fill_percentage >= 20 && 'bg-gradient-to-r from-amber-500 to-amber-600'
                      )}
                      style={{ width: `${liquid.fill_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {lowLiquids.length > 3 && (
          <Button
            variant='ghost'
            className='w-full rounded-xl font-semibold'
            onClick={() => router.push('/dashboard/barrel-oils')}
          >
            Alle Flüssigkeiten anzeigen →
          </Button>
        )}
      </CardContent>
    </Card>
    )}
    </>
  );
}
