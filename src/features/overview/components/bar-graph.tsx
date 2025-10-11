'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const description = 'Stock movements — interactive bar chart'

const chartConfig = {
  added: { label: 'Added', color: 'var(--primary)' },
  removed: { label: 'Removed', color: 'var(--primary)' },
  lowstock: { label: 'Low Stock', color: 'var(--primary)' },
} satisfies ChartConfig

export function BarGraph() {
  const supabase = createClient()
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('added')

  const [chartData, setChartData] = React.useState<any[]>([])
  const [totals, setTotals] = React.useState({ added: 0, removed: 0, lowstock: 0 })
  const [lowStockItems, setLowStockItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => setIsClient(true), [])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Bewegungsdaten abrufen
        const { data: logs, error: logError } = await supabase
          .from('artikel_log')
          .select('timestamp, aktion, menge_diff')
          .order('timestamp', { ascending: true })

        if (logError) throw logError

        // 2️⃣ Artikel abrufen
        const { data: artikel, error: artikelError } = await supabase
          .from('artikel')
          .select('artikelnummer, artikelbezeichnung, bestand, sollbestand, lieferant')

        if (artikelError) throw artikelError

        // 3️⃣ Niedrigen Bestand prüfen
        const lowStock = artikel.filter(
          (a) => (a.bestand ?? 0) < (a.sollbestand ?? 0)
        )

        const lowCount = lowStock.length

        // 4️⃣ Bewegungsdaten gruppieren
        const grouped: Record<string, { added: number; removed: number }> = {}
        logs.forEach((entry) => {
          const d = new Date(entry.timestamp)
          const key = d.toISOString().split('T')[0]
          if (!grouped[key]) grouped[key] = { added: 0, removed: 0 }

          if (entry.aktion === 'zubuchung')
            grouped[key].added += Math.abs(entry.menge_diff || 0)
          else if (entry.aktion === 'ausbuchung')
            grouped[key].removed += Math.abs(entry.menge_diff || 0)
        })

        const formatted = Object.entries(grouped).map(([date, values]) => ({
          date,
          added: values.added,
          removed: values.removed,
        }))

        // 5️⃣ State aktualisieren
        setChartData(formatted)
        setLowStockItems(lowStock)
        setTotals({
          added: formatted.reduce((a, c) => a + c.added, 0),
          removed: formatted.reduce((a, c) => a + c.removed, 0),
          lowstock: lowCount,
        })
      } catch (err) {
        console.error('❌ Failed to load chart data:', err)
        toast.error('Could not load stock data.')
      }
    }

    fetchData()
  }, [supabase])

  if (!isClient) return null

  return (
    <>
      {/* Hauptkarte */}
      <Card className="@container/card min-h-[496px]">
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
            <CardTitle>Stock Overview - Interactive</CardTitle>
            <CardDescription>
              <span className='hidden @[540px]/card:block'>
                Daily additions, removals, and low-stock alerts
              </span>
              <span className='@[540px]/card:hidden'>Last days</span>
            </CardDescription>
          </div>

          {/* Tabs oben */}
          <div className='flex'>
            {(['added', 'removed', 'lowstock'] as const).map((key) => (
              <button
                key={key}
                data-active={activeChart === key}
                className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => {
                  setActiveChart(key)
                  if (key === 'lowstock') setOpen(true)
                }}
              >
                <span className='text-muted-foreground text-xs'>
                  {chartConfig[key].label}
                </span>
                <span className='text-lg leading-none font-bold sm:text-3xl'>
                  {totals[key as keyof typeof totals]?.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--primary)' stopOpacity={0.8} />
                  <stop offset='100%' stopColor='var(--primary)' stopOpacity={0.2} />
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
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                content={
                  <ChartTooltipContent
                    className='w-[150px]'
                    nameKey={activeChart}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }
                  />
                }
              />
              {activeChart !== 'lowstock' && (
                <Bar dataKey={activeChart} fill='url(#fillBar)' radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Modal für Low Stock Details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Low Stock Items ({lowStockItems.length})</DialogTitle>
          </DialogHeader>

          {lowStockItems.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              🎉 All products are above minimum stock.
            </p>
          ) : (
            <div className='max-h-[400px] overflow-y-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Min</TableHead>
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
  )
}
