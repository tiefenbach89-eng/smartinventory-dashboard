'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AreaChart, Area, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ChartData = {
  month: string;
  value: number;
};

const chartConfig = {
  value: {
    label: 'Inventory Value (€)',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export default function AreaGraph() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lagerwert_log')
          .select('timestamp, lagerwert')
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const grouped: Record<string, number> = {};
        data?.forEach((entry) => {
          const d = new Date(entry.timestamp);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          grouped[key] = entry.lagerwert;
        });

        const formatted = Object.entries(grouped)
          .sort(([a], [b]) => (a > b ? 1 : -1))
          .map(([key, value]) => {
            const [year, monthIndex] = key.split('-').map(Number);
            const month = new Date(year, monthIndex).toLocaleString('en-US', {
              month: 'short'
            });
            return { month, value };
          });

        setChartData(formatted);
      } catch (err: any) {
        console.error('❌ Area chart error:', err);
        toast.error('Failed to load inventory history.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle>Inventory Value Over Time</CardTitle>
        <CardDescription>
          Historical sum of all products in stock
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 items-center justify-center px-2 pt-4 sm:px-6 sm:pt-6'>
        {loading ? (
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12
              }}
            >
              <defs>
                <linearGradient id='fillValue' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-value)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-value)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} opacity={0.1} />
              <XAxis
                dataKey='month'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => v.slice(0, 3)}
              />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator='dot' />}
              />

              <Area
                dataKey='value'
                type='natural'
                fill='url(#fillValue)'
                stroke='var(--color-value)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='text-muted-foreground font-medium'>
              Automatic inventory value tracking
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Updates when products change
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
