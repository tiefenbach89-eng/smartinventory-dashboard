'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, TrendingUp, Turtle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function RecentSales() {
  const supabase = createClient()

  // ✅ Erweiterter Typ für Top & Slow Movers
  type Mover = {
    artikelnummer: string
    artikelname: string
    menge: number
    lieferant?: string | null
    preis?: number | null
  }

  const [loading, setLoading] = React.useState(true)
  const [topMovers, setTopMovers] = React.useState<Mover[]>([])
  const [slowMovers, setSlowMovers] = React.useState<Mover[]>([])

  const [selectedArticle, setSelectedArticle] = React.useState<{
    nummer: string
    name: string
    lieferant?: string | null
    preis?: number | null
  } | null>(null)

  const [articleLogs, setArticleLogs] = React.useState<
    { timestamp: string; aktion: string; menge_diff: number; kommentar: string | null }[]
  >([])

  const [logLoading, setLogLoading] = React.useState(false)

  // 🔹 Bewegungsdaten laden (Top & Slow Movers)
  React.useEffect(() => {
    const fetchMovers = async () => {
      try {
        setLoading(true)
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

        // 👉 artikelname, lieferant, preis direkt aus artikel_log
        const { data: logs, error } = await supabase
          .from('artikel_log')
          .select('artikelnummer, artikelname, menge_diff, lieferant, preis_snapshot')
          .gte('timestamp', since)

        if (error) throw error
        if (!logs) return

        // 🔹 Bewegungen summieren
        const totalMoves: Record<string, number> = {}
        logs.forEach((l) => {
          const qty = Math.abs(l.menge_diff ?? 0)
          if (!isNaN(qty)) {
            totalMoves[l.artikelnummer] =
              (totalMoves[l.artikelnummer] ?? 0) + qty
          }
        })

        // 🔹 Array mit Name + Menge + Lieferant + Preis
        const moverArray = Object.entries(totalMoves)
          .map(([artikelnummer, menge]) => {
            const log = logs.find(
              (l) => String(l.artikelnummer) === String(artikelnummer)
            )
            return {
              artikelnummer,
              artikelname: log?.artikelname || `Artikel #${artikelnummer}`,
              lieferant: log?.lieferant || '—',
              preis: log?.preis_snapshot || null,
              menge,
            }
          })
          .sort((a, b) => b.menge - a.menge)

        // 🔹 Top & Slow Movers berechnen
        const top = moverArray.slice(0, 3)
        const slow = moverArray.slice(-3).reverse()

        setTopMovers(top)
        setSlowMovers(slow)
      } catch (err) {
        console.error('❌ Movement Fetch Error:', err)
        toast.error('Failed to load movement data.')
      } finally {
        setLoading(false)
      }
    }

    fetchMovers()
  }, [supabase])

  // 🔹 Logs für Artikel abrufen
  async function fetchLogsForArticle(article: {
    nummer: string
    name: string
    lieferant?: string | null
    preis?: number | null
  }) {
    try {
      setLogLoading(true)
      setSelectedArticle(article)

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('artikel_log')
        .select('timestamp, aktion, menge_diff, kommentar')
        .eq('artikelnummer', article.nummer)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setArticleLogs(data ?? [])
    } catch (err) {
      console.error('❌ Log fetch error:', err)
      toast.error('Failed to load article log.')
    } finally {
      setLogLoading(false)
    }
  }

  return (
    <>
      <Card className="col-span-4 md:col-span-4">
        <CardHeader>
          <CardTitle>Top & Slow Movers (30 Days)</CardTitle>
          <CardDescription>
            Quantity-based movement analysis for the last month
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* --- Top Movers --- */}
              <h3 className="text-sm font-semibold mb-2 text-green-500 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Top Movers
              </h3>
              <Table className="mb-6">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMovers.map((item, index) => (
                    <TableRow
                      key={`top-${item.artikelnummer}`}
                      className="cursor-pointer hover:bg-muted/50 transition"
                      onClick={() =>
                        fetchLogsForArticle({
                          nummer: item.artikelnummer,
                          name: item.artikelname,
                          lieferant: item.lieferant,
                          preis: item.preis,
                        })
                      }
                    >
                      <TableCell className="font-medium">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </TableCell>
                      <TableCell>{item.artikelname}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.menge}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* --- Slow Movers --- */}
              <h3 className="text-sm font-semibold mb-2 text-amber-500 flex items-center gap-1">
                <Turtle className="h-4 w-4" /> Slow or Inactive Movers
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowMovers.map((item, index) => (
                    <TableRow
                      key={`slow-${item.artikelnummer}`}
                      className="cursor-pointer hover:bg-muted/50 transition"
                      onClick={() =>
                        fetchLogsForArticle({
                          nummer: item.artikelnummer,
                          name: item.artikelname,
                          lieferant: item.lieferant,
                          preis: item.preis,
                        })
                      }
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        🐢 {index + 1}
                      </TableCell>
                      <TableCell>{item.artikelname}</TableCell>
                      <TableCell className="text-right font-semibold text-muted-foreground">
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

      {/* 🔍 Detail Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? (
                <>
                  {selectedArticle.name}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    #{selectedArticle.nummer}
                  </span>
                </>
              ) : (
                'Movement Details'
              )}
            </DialogTitle>

            {/* ✅ KORREKTES HTML — keine divs in p! */}
            {selectedArticle && (
              <DialogDescription asChild>
                <div className="mt-1 text-sm text-muted-foreground space-y-1">
                  <div>
                    <strong>Supplier:</strong> {selectedArticle.lieferant || '—'}
                  </div>
                  <div>
                    <strong>Price:</strong>{' '}
                    {selectedArticle.preis
                      ? `${selectedArticle.preis.toFixed(2)} €`
                      : '—'}
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          {logLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : articleLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2">
              No movement data available for this article.
            </p>
          ) : (
            <div className="mt-2 border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articleLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.menge_diff >= 0
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }
                        >
                          {(() => {
                            if (log.aktion?.toLowerCase().includes('zubuch'))
                              return 'Added'
                            if (log.aktion?.toLowerCase().includes('ausbuch'))
                              return 'Removed'
                            return log.aktion || (log.menge_diff >= 0 ? 'Added' : 'Removed')
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Math.abs(log.menge_diff)}
                      </TableCell>
                      <TableCell>{log.kommentar ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
