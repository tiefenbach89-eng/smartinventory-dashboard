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

export function RecentSales() {
  const supabase = createClient();

  type Mover = {
    artikelnummer: string;
    artikelname: string;
    menge: number;
    lieferant?: string | null;
    preis?: number | null;
  };

  const [loading, setLoading] = React.useState(true);
  const [topMovers, setTopMovers] = React.useState<Mover[]>([]);
  const [slowMovers, setSlowMovers] = React.useState<Mover[]>([]);

  const [selectedProduct, setSelectedProduct] = React.useState<{
    nummer: string;
    name: string;
    lieferant?: string | null;
    preis?: number | null;
  } | null>(null);

  const [articleLogs, setArticleLogs] = React.useState<
    {
      timestamp: string;
      aktion: string;
      menge_diff: number;
      kommentar: string | null;
      benutzer?: string | null;
      lieferscheinnr?: string | null;
    }[]
  >([]);

  const [logLoading, setLogLoading] = React.useState(false);

  // 🔹 Bewegungsdaten laden (Top & Slow Movers)
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

        const moverArray = Object.entries(totalMoves)
          .map(([artikelnummer, menge]) => {
            const log = logs.find(
              (l) => String(l.artikelnummer) === String(artikelnummer)
            );
            return {
              artikelnummer,
              artikelname: log?.artikelname || `Artikel #${artikelnummer}`,
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
        toast.error('Failed to load movement data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovers();
  }, [supabase]);

  // 🔹 Logs für Artikel abrufen
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
      toast.error('Failed to load article log.');
    } finally {
      setLogLoading(false);
    }
  }

  return (
    <>
      {/* 🧾 Top & Slow Movers Card */}
      <Card className='flex h-full flex-col'>
        <CardHeader>
          <CardTitle>Top & Slow Movers (30 Days)</CardTitle>
          <CardDescription>
            Quantity-based movement analysis for the last month
          </CardDescription>
        </CardHeader>

        <CardContent className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : (
            <>
              {/* --- Top Movers --- */}
              <h3 className='mb-2 flex items-center gap-1 text-sm font-semibold text-green-500'>
                <TrendingUp className='h-4 w-4' /> Top Movers
              </h3>
              <Table className='mb-6'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[60px]'>Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMovers.map((item, index) => (
                    <TableRow
                      key={`top-${item.artikelnummer}`}
                      className='hover:bg-muted/50 cursor-pointer transition'
                      onClick={() =>
                        fetchLogsForArticle({
                          nummer: item.artikelnummer,
                          name: item.artikelname,
                          lieferant: item.lieferant,
                          preis: item.preis
                        })
                      }
                    >
                      <TableCell className='font-medium'>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </TableCell>
                      <TableCell>{item.artikelname}</TableCell>
                      <TableCell className='text-right font-semibold'>
                        {item.menge}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* --- Slow Movers --- */}
              <h3 className='mb-2 flex items-center gap-1 text-sm font-semibold text-amber-500'>
                <Turtle className='h-4 w-4' /> Slow or Inactive Movers
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[60px]'>Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowMovers.map((item, index) => (
                    <TableRow
                      key={`slow-${item.artikelnummer}`}
                      className='hover:bg-muted/50 cursor-pointer transition'
                      onClick={() =>
                        fetchLogsForArticle({
                          nummer: item.artikelnummer,
                          name: item.artikelname,
                          lieferant: item.lieferant,
                          preis: item.preis
                        })
                      }
                    >
                      <TableCell className='text-muted-foreground font-medium'>
                        🐢 {index + 1}
                      </TableCell>
                      <TableCell>{item.artikelname}</TableCell>
                      <TableCell className='text-muted-foreground text-right font-semibold'>
                        {item.menge}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* 🧾 Product Movement Details Modal (Soft, Themed) */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className='bg-background/90 w-full max-w-6xl rounded-2xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <DialogHeader className='px-7 pt-7'>
            <DialogTitle className='text-lg font-semibold'>
              {selectedProduct?.name || 'Product Movements'}
            </DialogTitle>
            <CardDescription className='text-muted-foreground text-sm'>
              Detailed movement log for this product, including delivery notes.
            </CardDescription>
          </DialogHeader>

          {logLoading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : articleLogs.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No movements found.
            </p>
          ) : (
            <div className='border-border/40 mt-3 max-h-[70vh] overflow-y-auto rounded-b-2xl border-t'>
              <Table className='min-w-full text-sm'>
                <TableHeader className='bg-background/90 sticky top-0 z-10 backdrop-blur-md'>
                  <TableRow>
                    <TableHead className='w-[120px]'>Date</TableHead>
                    <TableHead className='w-[120px]'>Action</TableHead>
                    <TableHead className='w-[100px] text-right'>
                      Quantity
                    </TableHead>
                    <TableHead className='w-[200px]'>User</TableHead>
                    <TableHead className='w-[200px]'>Delivery Note</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {articleLogs.map((log, i) => (
                    <TableRow
                      key={i}
                      className='hover:bg-muted/30 transition-colors duration-150'
                    >
                      {/* Date */}
                      <TableCell className='whitespace-nowrap'>
                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <Badge
                          className={`rounded-lg border px-2 py-[2px] text-xs font-medium backdrop-blur-sm ${
                            log.menge_diff >= 0
                              ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                              : 'border-red-500/20 bg-red-500/15 text-red-400'
                          }`}
                        >
                          {log.menge_diff >= 0 ? 'Added' : 'Removed'}
                        </Badge>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className='text-right font-semibold whitespace-nowrap'>
                        {Math.abs(log.menge_diff)}
                      </TableCell>

                      {/* User */}
                      <TableCell className='text-foreground'>
                        {log.benutzer || 'System'}
                      </TableCell>

                      {/* Delivery Note — verwendet Theme-Farbe */}
                      <TableCell>
                        {log.lieferscheinnr ? (
                          <span className='border-primary/30 text-primary bg-primary/10 inline-flex items-center rounded-md border px-2 py-[2px] font-mono text-xs font-medium tracking-wide whitespace-nowrap backdrop-blur-sm'>
                            {log.lieferscheinnr}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>

                      {/* Comment */}
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
