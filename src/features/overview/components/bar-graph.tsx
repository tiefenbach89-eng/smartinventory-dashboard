'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';

export const description = 'Stock movements — interactive bar chart';

export function BarGraph() {
  const supabase = createClient();
  const t = useTranslations('overview'); // <-- flacher Namespace

  const chartConfig: ChartConfig = {
    added: { label: t('barAdded'), color: 'var(--primary)' },
    removed: { label: t('barRemoved'), color: 'var(--primary)' },
    lowstock: { label: t('barLowStock'), color: 'var(--primary)' }
  };

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('added');

  const [chartData, setChartData] = React.useState<any[]>([]);
  const [totals, setTotals] = React.useState({
    added: 0,
    removed: 0,
    lowstock: 0
  });
  const [lowStockItems, setLowStockItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => setIsClient(true), []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: logs, error: logError } = await supabase
          .from('artikel_log')
          .select('timestamp, aktion, menge_diff, artikelname, artikelnummer')
          .order('timestamp', { ascending: true });

        if (logError) throw logError;

        const { data: artikel, error: artikelError } = await supabase
          .from('artikel')
          .select(
            'artikelnummer, artikelbezeichnung, bestand, sollbestand, lieferant'
          );

        if (artikelError) throw artikelError;

        const lowStock = artikel.filter(
          (a) => (a.bestand ?? 0) < (a.sollbestand ?? 0)
        );
        const lowCount = lowStock.length;

        const grouped: Record<string, {
          added: number;
          removed: number;
          addedItems: { name: string; qty: number }[];
          removedItems: { name: string; qty: number }[];
        }> = {};

        logs.forEach((entry) => {
          const d = new Date(entry.timestamp);
          const key = d.toISOString().split('T')[0];
          if (!grouped[key]) {
            grouped[key] = {
              added: 0,
              removed: 0,
              addedItems: [],
              removedItems: []
            };
          }

          const itemName = entry.artikelname || entry.artikelnummer || 'Unbekannt';
          const qty = Math.abs(entry.menge_diff || 0);

          if (['zubuchung', 'addition', 'added'].includes(entry.aktion)) {
            grouped[key].added += qty;
            grouped[key].addedItems.push({ name: itemName, qty });
          } else if (['ausbuchung', 'removal', 'removed'].includes(entry.aktion)) {
            grouped[key].removed += qty;
            grouped[key].removedItems.push({ name: itemName, qty });
          }
        });

        const formatted = Object.entries(grouped).map(([date, values]) => ({
          date,
          added: values.added,
          removed: values.removed,
          addedItems: values.addedItems,
          removedItems: values.removedItems
        }));

        setChartData(formatted);
        setLowStockItems(lowStock);
        setTotals({
          added: formatted.reduce((a, c) => a + c.added, 0),
          removed: formatted.reduce((a, c) => a + c.removed, 0),
          lowstock: lowCount
        });
      } catch (err) {
        console.error('❌ Failed to load chart data:', err);
        toast.error(t('barLoadError'));
      }
    };

    fetchData();
  }, [supabase, t]);

  if (!isClient) return null;

  return (
    <>
      {/* Hauptkarte */}
      <Card className='flex h-full flex-col border-0'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b border-border/10 !p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-2 px-6 py-6'>
            <CardTitle className='text-xl font-black'>{t('barTitle')}</CardTitle>
            <CardDescription className='font-semibold'>
              <span className='hidden @[540px]/card:block'>
                {t('barSubtitleDesktop')}
              </span>
              <span className='@[540px]/card:hidden'>
                {t('barSubtitleMobile')}
              </span>
            </CardDescription>
          </div>

          {/* Tabs oben */}
          <div className='flex'>
            {(['added', 'removed'] as const).map((key) => (
              <button
                key={key}
                data-active={activeChart === key}
                className='data-[active=true]:bg-primary/10 data-[active=true]:shadow-inner hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1.5 border-t border-border/10 px-6 py-4 text-left transition-all duration-300 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => {
                  setActiveChart(key);
                }}
              >
                <span className='text-muted-foreground text-xs font-semibold uppercase tracking-wider'>
                  {chartConfig[key].label}
                </span>
                <span className='text-2xl font-black leading-none tabular-nums sm:text-3xl'>
                  {totals[key].toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className='flex-1 px-2 pt-6 sm:px-6 sm:pt-8'>
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#3b82f6' stopOpacity={0.9} />
                  <stop offset='100%' stopColor='#1d4ed8' stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return t('dateShort', {
                    date: date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  });
                }}
              />

              <ChartTooltip
                cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const date = new Date(payload[0].payload.date);
                  const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  const value = payload[0].value;
                  const items = activeChart === 'added'
                    ? payload[0].payload.addedItems || []
                    : payload[0].payload.removedItems || [];

                  return (
                    <div className='bg-background/95 border-border/40 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md min-w-[200px]'>
                      <div className='text-primary mb-2 font-semibold text-sm'>
                        {t('dateLong', { date: dateStr })}
                      </div>
                      <div className='text-foreground mb-2 text-sm font-bold'>
                        {activeChart === 'added' ? t('barAdded') : t('barRemoved')}: {value}
                      </div>
                      {items.length > 0 && (
                        <div className='border-border/20 border-t pt-2 mt-2'>
                          <div className='text-muted-foreground text-xs font-semibold mb-1'>
                            Artikel:
                          </div>
                          <div className='space-y-1 max-h-[200px] overflow-y-auto'>
                            {items.slice(0, 10).map((item: any, idx: number) => (
                              <div key={idx} className='text-xs flex justify-between gap-2'>
                                <span className='truncate'>{item.name}</span>
                                <span className='font-semibold text-primary'>
                                  {item.qty}
                                </span>
                              </div>
                            ))}
                            {items.length > 10 && (
                              <div className='text-muted-foreground text-xs italic mt-1'>
                                +{items.length - 10} weitere...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              <Bar
                dataKey={activeChart}
                fill='url(#fillBar)'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Modal für Low Stock Details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {t('barLowStockModalTitle', { count: lowStockItems.length })}
            </DialogTitle>
          </DialogHeader>

          {lowStockItems.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              {t('barLowStockNone')}
            </p>
          ) : (
            <div className='max-h-[400px] overflow-y-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('barColumnArticle')}</TableHead>
                    <TableHead>{t('barColumnSupplier')}</TableHead>
                    <TableHead>{t('barColumnStock')}</TableHead>
                    <TableHead>{t('barColumnMin')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.artikelnummer}>
                      <TableCell>{item.artikelbezeichnung}</TableCell>
                      <TableCell>{item.lieferant}</TableCell>
                      <TableCell>{item.bestand}</TableCell>
                      <TableCell>{item.sollbestand}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
