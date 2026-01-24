'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type SupplierData = {
  supplier: string;
  value: number;
  fill?: string;
};

export function PieGraph() {
  const supabase = createClient();
  const t = useTranslations('overview'); // <-- kein "pie" Namespace

  const [chartData, setChartData] = React.useState<SupplierData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artikel')
          .select('lieferant, preis, bestand');

        if (error) throw error;

        const grouped: Record<string, number> = {};
        data?.forEach((row) => {
          const name = (row.lieferant ?? t('pieUnknown')).trim();
          const value = (Number(row.preis) || 0) * (Number(row.bestand) || 0);
          grouped[name] = (grouped[name] || 0) + value;
        });

        const formatted = Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([supplier, value], index) => ({
            supplier,
            value,
            fill: `url(#fill${index})`
          }));

        setChartData(formatted);
      } catch (err: any) {
        console.error('❌ PieChart error:', err);
        toast.error(t('pieLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, t]);

  const totalValue = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  if (loading) {
    return (
      <Card className='flex h-full items-center justify-center'>
        <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
      </Card>
    );
  }

  return (
    <Card className='flex h-full flex-col border-0'>
      <CardHeader className='border-b border-border/10 pb-6'>
        <CardTitle className='text-xl font-black'>{t('pieTitle')}</CardTitle>
        <CardDescription className='font-semibold'>
          <span className='hidden @[540px]/card:block'>
            {t('pieSubtitleDesktop')}
          </span>
          <span className='@[540px]/card:hidden'>{t('pieSubtitleMobile')}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 items-center justify-center px-2 pt-6 sm:px-6 sm:pt-8'>
        <ChartContainer
          config={{
            value: { label: t('pieValueLabel') }
          }}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {chartData.map((item, index) => (
                <linearGradient
                  key={index}
                  id={`fill${index}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='#8b5cf6'
                    stopOpacity={1 - index * 0.15}
                  />
                  <stop
                    offset='100%'
                    stopColor='#6d28d9'
                    stopOpacity={0.8 - index * 0.15}
                  />
                </linearGradient>
              ))}
            </defs>

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey='value'
              nameKey='supplier'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-black tabular-nums'
                        >
                          {Math.round(totalValue).toLocaleString()} €
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-xs font-semibold uppercase tracking-wider'
                        >
                          {t('pieTotalLabel')}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className='flex-col gap-2 text-sm'>
        {chartData.length > 0 && (
          <div className='flex items-center gap-2 leading-none font-medium'>
            {t('pieLeader', {
              supplier: chartData[0].supplier,
              percent: ((chartData[0].value / totalValue) * 100).toFixed(1)
            })}{' '}
            <IconTrendingUp className='h-4 w-4' />
          </div>
        )}
        <div className='text-muted-foreground leading-none'>
          {t('pieFooter')}
        </div>
      </CardFooter>
    </Card>
  );
}
