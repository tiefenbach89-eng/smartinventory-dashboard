'use client';

import * as React from 'react';
import { IconTrendingUp } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';
import { createClient } from '@/lib/supabase/client';

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
          const name = (row.lieferant ?? 'Unknown Supplier').trim();
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
        toast.error('Failed to load supplier distribution.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

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
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle>Supplier Distribution</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Total inventory value per supplier
          </span>
          <span className='@[540px]/card:hidden'>Supplier share</span>
        </CardDescription>
      </CardHeader>

      {/* Der Hauptbereich dehnt sich vollständig, auch bei leerem Inhalt */}
      <CardContent className='flex flex-1 items-center justify-center px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={{
            value: { label: 'Value (€)' }
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
                    stopColor='var(--primary)'
                    stopOpacity={1 - index * 0.15}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
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
                          className='fill-foreground text-3xl font-bold'
                        >
                          {Math.round(totalValue).toLocaleString()} €
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Value
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
            {chartData[0].supplier} leads with{' '}
            {((chartData[0].value / totalValue) * 100).toFixed(1)} %{' '}
            <IconTrendingUp className='h-4 w-4' />
          </div>
        )}
        <div className='text-muted-foreground leading-none'>
          Based on current inventory data
        </div>
      </CardFooter>
    </Card>
  );
}
