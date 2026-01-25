'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

/* ---------------------------------- Types --------------------------------- */

type ViewMode = 'monthly' | 'live';

export type MonthlyPoint = {
  label: string;
  value: number;
  monthStartISO: string;
  monthEndISO: string;
  prettyMonth: string;
  changePct?: number | null;
};

export type LivePoint = {
  label: string;
  value: number;
  dateLabel: string;
  kommentar?: string | null;
};

export type DrilldownRow = {
  artikelnummer: string;
  artikelname: string | null;
  total_qty: number;
  unit_price: number | null;
  total_value: number;
  type?: 'product' | 'barrel'; // NEW: Unterscheidung zwischen Produkt und Barrel Oil
};

/* --------------------------------- Utils ---------------------------------- */

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function fmtEUR(v: number | null | undefined) {
  const n = Number(v ?? 0);
  return n.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  });
}

// Custom Tick Component für X- und Y-Achse
const AxisTick = (props: any) => {
  const { x, y, payload, textAnchor } = props;

  return (
    <text
      x={x}
      y={y + 12}
      textAnchor={textAnchor || 'middle'}
      className='fill-muted-foreground text-[11px] font-normal'
    >
      {payload.value}
    </text>
  );
};

/* -------------------------------- Component ------------------------------- */

export default function AreaGraph() {
  const supabase = createClient();
  const t = useTranslations('overview');

  const [mode, setMode] = React.useState<ViewMode>('monthly');
  const [loading, setLoading] = React.useState(true);

  const [monthlyData, setMonthlyData] = React.useState<MonthlyPoint[]>([]);
  const [liveData, setLiveData] = React.useState<LivePoint[]>([]);

  const [openDrill, setOpenDrill] = React.useState(false);
  const [drillTitle, setDrillTitle] = React.useState('');
  const [drillRange, setDrillRange] = React.useState<{
    from: string;
    to: string;
  } | null>(null);

  const [drillRows, setDrillRows] = React.useState<DrilldownRow[]>([]);
  const [drillLoading, setDrillLoading] = React.useState(false);

  /* ------------------------------- Fetch Data ------------------------------ */

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const twelveMonthsAgo = addMonths(new Date(), -12);

        // 1. Lade Produktwerte aus lagerwert_log
        const { data: lagerwert, error } = await supabase
          .from('lagerwert_log')
          .select('timestamp, lagerwert, kommentar')
          .gte('timestamp', twelveMonthsAgo.toISOString())
          .order('timestamp', { ascending: true });

        if (error) throw error;

        // 2. Lade alle Barrel Oils Kosten (add-Einträge) aus Historie
        const { data: barrelHistory, error: barrelError } = await supabase
          .from('barrel_oil_history')
          .select('created_at, total_cost, action')
          .eq('action', 'add')
          .gte('created_at', twelveMonthsAgo.toISOString())
          .order('created_at', { ascending: true });

        if (barrelError) {
          console.warn('⚠️ Barrel history error:', barrelError);
        }

        const filtered = (lagerwert ?? []).filter((r) =>
          (r.kommentar ?? '').toLowerCase().includes('automatisch')
        );

        const buckets: Record<string, number[]> = {};

        // Berechne kumulierte Barrel Oils Kosten bis zu jedem Zeitpunkt
        const barrelCosts = barrelHistory ?? [];

        filtered.forEach((r) => {
          const d = new Date(r.timestamp);
          const key = `${d.getFullYear()}-${d.getMonth()}`;

          // Berechne Barrel Oils Kosten bis zu diesem Zeitpunkt
          const barrelValueUpToNow = barrelCosts
            .filter(b => new Date(b.created_at) <= d)
            .reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);

          const totalValue = (Number(r.lagerwert) || 0) + barrelValueUpToNow;
          (buckets[key] ??= []).push(totalValue);
        });

        const months: Date[] = [];
        for (let i = 11; i >= 0; i--) months.push(addMonths(new Date(), -i));

        const monthly: MonthlyPoint[] = months
          .map((m) => {
            const key = `${m.getFullYear()}-${m.getMonth()}`;
            const vals = buckets[key] ?? [];
            const avg = vals.length
              ? vals.reduce((a, b) => a + b, 0) / vals.length
              : 0;

            return {
              label: m.toLocaleString('en-US', {
                month: 'short',
                year: '2-digit'
              }),
              value: Math.round(avg),
              monthStartISO: startOfMonth(m).toISOString(),
              monthEndISO: endOfMonth(m).toISOString(),
              prettyMonth: m.toLocaleDateString('de-DE', {
                month: 'long',
                year: 'numeric'
              }),
              changePct: null
            };
          })
          .filter((p) => p.value > 0);

        for (let i = 1; i < monthly.length; i++) {
          const prev = monthly[i - 1].value || 0.00001;
          monthly[i].changePct = ((monthly[i].value - prev) / prev) * 100;
        }

        setMonthlyData(monthly);

        // Live-Daten: Ebenfalls mit Barrel Oils Kosten
        const { data: live, error: errLive } = await supabase
          .from('lagerwert_log')
          .select('timestamp, lagerwert, kommentar')
          .gte('timestamp', twelveMonthsAgo.toISOString())
          .order('timestamp', { ascending: true });

        if (errLive) throw errLive;

        const livePts: LivePoint[] = (live ?? [])
          .filter((r) =>
            (r.kommentar ?? '').toLowerCase().includes('automatisch')
          )
          .slice(-200)
          .map((r) => {
            const d = new Date(r.timestamp);

            // Berechne Barrel Oils Kosten bis zu diesem Zeitpunkt
            const barrelValueUpToNow = barrelCosts
              .filter(b => new Date(b.created_at) <= d)
              .reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);

            const totalValue = (Number(r.lagerwert) || 0) + barrelValueUpToNow;

            return {
              label: d.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              value: totalValue,
              dateLabel: d.toLocaleString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              kommentar: r.kommentar
            };
          });

        setLiveData(livePts);
      } catch (e) {
        console.error('❌ Fetch error:', e);
        toast.error(t('areaLoadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, t]);

  /* ---------------------------- Drilldown loader --------------------------- */

  async function handleOpenDrill(p: MonthlyPoint) {
    try {
      setDrillTitle(p.prettyMonth);
      setDrillRange({ from: p.monthStartISO, to: p.monthEndISO });
      setOpenDrill(true);
      setDrillLoading(true);

      // 1. Lade Produkt-Zugänge
      const { data, error } = await supabase
        .from('artikel_log')
        .select('artikelnummer, artikelname, menge_diff, preis_snapshot')
        .gte('timestamp', p.monthStartISO)
        .lte('timestamp', p.monthEndISO);

      if (error) throw error;

      const adds = (data ?? []).filter((r) => Number(r.menge_diff) > 0);

      const map: Record<string, DrilldownRow> = {};

      for (const r of adds) {
        const key = r.artikelnummer;
        const qty = Number(r.menge_diff) || 0;
        const price = r.preis_snapshot ? Number(r.preis_snapshot) : null;

        if (!map[key]) {
          map[key] = {
            artikelnummer: key,
            artikelname: r.artikelname ?? null,
            total_qty: 0,
            unit_price: price,
            total_value: 0,
            type: 'product'
          };
        }

        map[key].total_qty += qty;
        if (price != null) map[key].unit_price = price;
      }

      // 2. Lade Barrel Oils Zugänge
      const { data: barrelData, error: barrelError } = await supabase
        .from('barrel_oil_history')
        .select(`
          amount,
          unit_price,
          total_cost,
          barrel_id,
          barrel_oils!inner(brand, viscosity)
        `)
        .eq('action', 'add')
        .gte('created_at', p.monthStartISO)
        .lte('created_at', p.monthEndISO);

      if (barrelError) {
        console.warn('⚠️ Barrel drilldown error:', barrelError);
      } else if (barrelData) {
        // Gruppiere nach Brand (ähnlich wie bei Produkten nach artikelnummer)
        barrelData.forEach((b: any) => {
          const brand = b.barrel_oils?.brand || 'Unbekannt';
          const viscosity = b.barrel_oils?.viscosity || '';
          const key = `BARREL_${brand}_${viscosity}`;

          if (!map[key]) {
            map[key] = {
              artikelnummer: brand,
              artikelname: viscosity ? `${viscosity} (Öl)` : '(Öl)',
              total_qty: 0,
              unit_price: Number(b.unit_price) || null,
              total_value: 0,
              type: 'barrel'
            };
          }

          map[key].total_qty += Number(b.amount) || 0;
          map[key].total_value += Number(b.total_cost) || 0;
        });
      }

      const rows = Object.values(map).map((r) => ({
        ...r,
        total_value: r.type === 'barrel'
          ? r.total_value
          : (r.unit_price != null ? r.unit_price * r.total_qty : 0)
      }));

      setDrillRows(rows.sort((a, b) => b.total_value - a.total_value));
    } catch (e) {
      console.error('❌ Drilldown error:', e);
      toast.error(t('areaDrillError'));
    } finally {
      setDrillLoading(false);
    }
  }

  /* ------------------------------ Render logic ----------------------------- */

  const chartData = mode === 'monthly' ? monthlyData : liveData;
  const isMonthly = mode === 'monthly';

  return (
    <Card className='flex h-full flex-col border-0'>
      {/* ----------------------------- Header ----------------------------- */}
      <CardHeader className='flex flex-row items-start justify-between gap-3 border-b border-border/10 pb-6'>
        <div>
          <CardTitle className='text-xl font-black'>{t('areaTitle')}</CardTitle>
          <CardDescription className='font-semibold'>
            {isMonthly ? t('areaSubtitleMonthly') : t('areaSubtitleLive')}
          </CardDescription>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            className={`h-8 rounded-2xl px-3 text-sm font-medium ${
              mode === 'monthly'
                ? 'bg-muted/70 text-primary border-primary/30 border'
                : 'bg-muted/40 text-muted-foreground border'
            }`}
            onClick={() => setMode('monthly')}
          >
            {t('areaBtnMonthly')}
          </Button>

          <Button
            size='sm'
            className={`h-8 rounded-2xl px-3 text-sm font-medium ${
              mode === 'live'
                ? 'bg-muted/70 text-primary border-primary/30 border'
                : 'bg-muted/40 text-muted-foreground border'
            }`}
            onClick={() => setMode('live')}
          >
            {t('areaBtnLive')}
          </Button>
        </div>
      </CardHeader>

      {/* ----------------------------- Chart ----------------------------- */}

      <CardContent className='flex flex-1 items-center justify-center px-2 pt-6 sm:px-6 sm:pt-8'>
        {loading ? (
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        ) : chartData.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t('areaNoData')}</p>
        ) : (
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, left: 12, right: 12, bottom: 5 }}
              onClick={(e: any) => {
                if (isMonthly && e?.activePayload?.[0]?.payload)
                  handleOpenDrill(e.activePayload[0].payload as MonthlyPoint);
              }}
            >
              <defs>
                <linearGradient id='fillValue' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='#f97316'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='#ea580c'
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} opacity={0.15} />

              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={<AxisTick />}
              />

              <YAxis
                domain={['dataMin - 10', 'dataMax + 10']}
                tickLine={false}
                axisLine={false}
                tick={<AxisTick />}
              />

              <YAxis domain={['dataMin - 10', 'dataMax + 10']} />

              <ReTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;

                  const d = payload[0].payload;

                  if (isMonthly) {
                    return (
                      <div className='bg-background/95 border-border/40 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md'>
                        <div className='text-primary mb-1 font-semibold'>
                          {d.prettyMonth}
                        </div>
                        <div className='text-foreground text-sm'>
                          {t('areaTooltipAvg')}:{' '}
                          <strong>{fmtEUR(d.value)}</strong>
                        </div>

                        {typeof d.changePct === 'number' && (
                          <div
                            className={`text-xs font-medium ${
                              d.changePct >= 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {t('areaTooltipChange')} {d.changePct.toFixed(1)}%
                          </div>
                        )}

                        <div className='text-muted-foreground mt-2 text-xs'>
                          {t('areaTooltipClick')}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className='bg-background/95 border-border/40 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md'>
                      <div className='text-primary mb-1 font-semibold'>
                        {d.dateLabel}
                      </div>
                      <div className='text-foreground text-sm'>
                        {t('areaTooltipValue')}:{' '}
                        <strong>{fmtEUR(d.value)}</strong>
                      </div>
                      {d.kommentar && (
                        <div className='text-muted-foreground mt-1 text-xs italic'>
                          {d.kommentar}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              <Area
                dataKey='value'
                type='monotone'
                fill='url(#fillValue)'
                stroke='#f97316'
                strokeWidth={2.5}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>

      {/* ----------------------------- Footer ----------------------------- */}
      <CardFooter className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          {isMonthly ? t('areaFooterMonthly') : t('areaFooterLive')}
        </div>

        {isMonthly && (
          <span className='text-muted-foreground text-xs'>
            {t('areaFooterTip')}
          </span>
        )}
      </CardFooter>

      {/* ----------------------------- Drilldown ----------------------------- */}
      <Dialog open={openDrill} onOpenChange={setOpenDrill}>
        <DialogContent className='bg-background/95 border-border/40 max-w-4xl rounded-2xl border p-6 shadow-2xl backdrop-blur-lg'>
          <DialogHeader>
            <DialogTitle>{t('areaDrillTitle')}</DialogTitle>
            <DialogDescription>{drillTitle}</DialogDescription>
          </DialogHeader>

          {drillLoading ? (
            <div className='flex justify-center py-10'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : drillRows.length === 0 ? (
            <p className='text-muted-foreground py-4 text-center text-sm'>
              {t('areaDrillEmpty')}
            </p>
          ) : (
            <div className='border-border/40 mt-2 overflow-hidden rounded-b-2xl border-t'>
              <Table className='min-w-full text-sm'>
                <TableHeader className='bg-muted/10'>
                  <TableRow>
                    <TableHead className='w-[130px]'>
                      {t('areaDrillColArticle')}
                    </TableHead>
                    <TableHead>{t('areaDrillColName')}</TableHead>
                    <TableHead className='w-[110px] text-right'>
                      {t('areaDrillColQty')}
                    </TableHead>
                    <TableHead className='w-[130px] text-right'>
                      {t('areaDrillColPrice')}
                    </TableHead>
                    <TableHead className='w-[140px] text-right'>
                      {t('areaDrillColTotal')}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {drillRows.map((r) => (
                    <TableRow key={r.artikelnummer}>
                      <TableCell>
                        {r.artikelnummer}
                        {r.type === 'barrel' && (
                          <span className='ml-2 inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600'>
                            Öl
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{r.artikelname ?? '—'}</TableCell>
                      <TableCell className='text-right'>
                        {r.total_qty} {r.type === 'barrel' ? 'L' : 'Stk'}
                      </TableCell>
                      <TableCell className='text-right'>
                        {r.unit_price != null ? fmtEUR(r.unit_price) : '—'}
                      </TableCell>
                      <TableCell className='text-right'>
                        {fmtEUR(r.total_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
