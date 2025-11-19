'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import { Loader2, TrendingUp, Turtle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// 📊 Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell
} from 'recharts';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

type Mover = {
  artikelnummer: string;
  artikelname: string;
  menge: number;
  lieferant?: string | null;
  preis?: number | null;
};

type ArticleLog = {
  timestamp: string;
  aktion: string;
  menge_diff: number;
  kommentar: string | null;
  benutzer?: string | null;
  lieferscheinnr?: string | null;
};

// ---------------------------------------------------------------------
// CUSTOM TOOLTIP (ShadCN Style, Light/Dark mode, no background overlay)
// ---------------------------------------------------------------------
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div className='bg-background/95 border-border/40 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md'>
      {/* Rank */}
      <div className='text-muted-foreground mb-1 text-[10px] uppercase'>
        #{item.rank}
      </div>

      {/* Name */}
      <div className='text-foreground mb-1 font-semibold'>
        {item.artikelname}
      </div>

      {/* Menge */}
      <div className='flex justify-between text-sm'>
        <span className='text-muted-foreground'>Menge:</span>
        <span className='font-bold'>{item.menge}</span>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export function RecentSales() {
  const supabase = createClient();
  const t = useTranslations('RecentSales');

  const [loading, setLoading] = React.useState(true);
  const [topMovers, setTopMovers] = React.useState<Mover[]>([]);
  const [slowMovers, setSlowMovers] = React.useState<Mover[]>([]);

  const [selectedProduct, setSelectedProduct] = React.useState<{
    nummer: string;
    name: string;
    lieferant?: string | null;
    preis?: number | null;
  } | null>(null);

  const [articleLogs, setArticleLogs] = React.useState<ArticleLog[]>([]);
  const [logLoading, setLogLoading] = React.useState(false);

  const truncateLabel = (label: string, max = 24) =>
    label.length > max ? `${label.slice(0, max - 1)}…` : label;

  const topChartData = topMovers.map((m, index) => ({
    ...m,
    rank: index + 1,
    label: truncateLabel(m.artikelname)
  }));

  const slowChartData = slowMovers.map((m, index) => ({
    ...m,
    rank: index + 1,
    label: truncateLabel(m.artikelname)
  }));

  // -----------------------------------------------------
  // FETCH MOVERS (30 days)
  // -----------------------------------------------------
  React.useEffect(() => {
    const fetchMovers = async () => {
      try {
        setLoading(true);

        const since = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: logs, error } = await supabase
          .from('artikel_log')
          .select(
            'artikelnummer, artikelname, menge_diff, lieferant, preis_snapshot'
          )
          .gte('timestamp', since);

        if (error) throw error;
        if (!logs) return;

        const totalMoves: Record<string, number> = {};
        logs.forEach((l) => {
          const qty = Math.abs(l.menge_diff ?? 0);
          if (!isNaN(qty)) {
            totalMoves[l.artikelnummer] =
              (totalMoves[l.artikelnummer] ?? 0) + qty;
          }
        });

        const moverArray: Mover[] = Object.entries(totalMoves)
          .map(([artikelnummer, menge]) => {
            const log = logs.find(
              (l) => String(l.artikelnummer) === String(artikelnummer)
            );
            return {
              artikelnummer,
              artikelname:
                log?.artikelname ||
                t('fallback_product', { id: artikelnummer }),
              lieferant: log?.lieferant || '—',
              preis: log?.preis_snapshot || null,
              menge
            };
          })
          .sort((a, b) => b.menge - a.menge);

        const top = moverArray.slice(0, 3);
        const slow = moverArray.slice(-3).reverse();

        setTopMovers(top);
        setSlowMovers(slow);
      } catch (err) {
        console.error('❌ Movement Fetch Error:', err);
        toast.error(t('fetch_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchMovers();
  }, [supabase, t]);

  // -----------------------------------------------------
  // FETCH LOGS FOR PRODUCT
  // -----------------------------------------------------
  async function fetchLogsForArticle(article: {
    nummer: string;
    name: string;
    lieferant?: string | null;
    preis?: number | null;
  }) {
    try {
      setLogLoading(true);
      setSelectedProduct(article);

      const since = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from('artikel_log')
        .select(
          'timestamp, aktion, menge_diff, kommentar, benutzer, lieferscheinnr'
        )
        .eq('artikelnummer', article.nummer)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setArticleLogs(data ?? []);
    } catch (err) {
      console.error('❌ Log fetch error:', err);
      toast.error(t('log_failed'));
    } finally {
      setLogLoading(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <Card className='flex h-full flex-col'>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <CardContent className='flex flex-1 flex-col gap-6'>
          {loading ? (
            <div className='flex flex-1 items-center justify-center'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : (
            <>
              {/* ---------------- TOP MOVERS ---------------- */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-primary flex items-center gap-2 text-sm font-semibold'>
                    <TrendingUp className='h-4 w-4' />
                    {t('top_movers')}
                  </h3>
                  <span className='text-muted-foreground text-[11px]'>
                    {t('last_30_days')}
                  </span>
                </div>

                {topChartData.length === 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    {t('no_top_movers')}
                  </p>
                ) : (
                  <div className='text-primary h-40'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={topChartData}
                        layout='vertical'
                        margin={{ left: 0, right: 10, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          horizontal={false}
                          stroke='rgba(148,163,184,0.15)'
                        />
                        <XAxis
                          type='number'
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey='label'
                          type='category'
                          width={120}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        {/* ---------------- Tooltip FIX ---------------- */}
                        <RechartsTooltip
                          content={<CustomTooltip />}
                          cursor={false} // <-- entfernt grauen Balken
                          wrapperStyle={{
                            background: 'transparent',
                            outline: 'none',
                            pointerEvents: 'none',
                            boxShadow: 'none'
                          }}
                        />

                        <Bar
                          dataKey='menge'
                          radius={[0, 10, 10, 0]}
                          barSize={14}
                          onClick={(data: any) =>
                            fetchLogsForArticle({
                              nummer: data.artikelnummer,
                              name: data.artikelname,
                              lieferant: data.lieferant,
                              preis: data.preis
                            })
                          }
                        >
                          {topChartData.map((entry) => (
                            <Cell
                              key={entry.artikelnummer}
                              cursor='pointer'
                              fill='currentColor'
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ---------------- SLOW MOVERS ---------------- */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-primary/80 flex items-center gap-2 text-sm font-semibold'>
                    <Turtle className='h-4 w-4' />
                    {t('slow_movers')}
                  </h3>
                  <span className='text-muted-foreground text-[11px]'>
                    {t('last_30_days')}
                  </span>
                </div>

                {slowChartData.length === 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    {t('no_slow_movers')}
                  </p>
                ) : (
                  <div className='text-primary h-40'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={slowChartData}
                        layout='vertical'
                        margin={{ left: 0, right: 10, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          horizontal={false}
                          stroke='rgba(148,163,184,0.15)'
                        />
                        <XAxis
                          type='number'
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey='label'
                          type='category'
                          width={120}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        {/* Tooltip Fix hier auch */}
                        <RechartsTooltip
                          content={<CustomTooltip />}
                          cursor={false}
                          wrapperStyle={{
                            background: 'transparent',
                            outline: 'none',
                            pointerEvents: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        <Bar
                          dataKey='menge'
                          radius={[0, 10, 10, 0]}
                          barSize={14}
                          onClick={(data: any) =>
                            fetchLogsForArticle({
                              nummer: data.artikelnummer,
                              name: data.artikelname,
                              lieferant: data.lieferant,
                              preis: data.preis
                            })
                          }
                        >
                          {slowChartData.map((entry) => (
                            <Cell
                              key={entry.artikelnummer}
                              cursor='pointer'
                              fill='transparent'
                              stroke='currentColor'
                              strokeWidth={2}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------------- MODAL ---------------- */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className='bg-background/95 max-w-6xl rounded-2xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <DialogHeader className='px-7 pt-7'>
            <DialogTitle className='text-lg font-semibold'>
              {selectedProduct?.name || t('modal.title')}
            </DialogTitle>
            <CardDescription className='text-muted-foreground text-sm'>
              {t('modal.description')}
            </CardDescription>
          </DialogHeader>

          {logLoading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : articleLogs.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              {t('no_logs')}
            </p>
          ) : (
            <div className='border-border/40 mt-3 max-h-[70vh] overflow-y-auto rounded-b-2xl border-t'>
              <Table className='min-w-full text-sm'>
                <TableHeader className='bg-background/90 sticky top-0 backdrop-blur-md'>
                  <TableRow>
                    <TableHead className='w-[120px]'>{t('date')}</TableHead>
                    <TableHead className='w-[120px]'>{t('action')}</TableHead>
                    <TableHead className='w-[100px] text-right'>
                      {t('quantity')}
                    </TableHead>
                    <TableHead className='w-[200px]'>{t('user')}</TableHead>
                    <TableHead className='w-[200px]'>
                      {t('delivery_note')}
                    </TableHead>
                    <TableHead>{t('comment')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {articleLogs.map((log, i) => (
                    <TableRow key={i} className='hover:bg-muted/30'>
                      <TableCell className='whitespace-nowrap'>
                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-lg border px-2 py-[2px] text-xs font-medium backdrop-blur-sm ${
                            log.menge_diff >= 0
                              ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                              : 'border-red-500/20 bg-red-500/15 text-red-400'
                          }`}
                        >
                          {log.menge_diff >= 0 ? t('added') : t('removed')}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        {Math.abs(log.menge_diff)}
                      </TableCell>
                      <TableCell>{log.benutzer || t('system')}</TableCell>
                      <TableCell>
                        {log.lieferscheinnr ? (
                          <span className='border-primary/30 bg-primary/10 text-primary inline-flex rounded-md border px-2 py-[2px] font-mono text-xs'>
                            {log.lieferscheinnr}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground max-w-[320px] truncate'>
                        {log.kommentar || '—'}
                      </TableCell>
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
