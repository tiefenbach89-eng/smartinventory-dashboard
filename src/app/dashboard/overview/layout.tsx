'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingUp } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const supabase = createClient();

  const [inventoryValue, setInventoryValue] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [movementCount, setMovementCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Gesamtwert und Lieferanten aus 'artikel'
        const { data: artikel, error: artikelError } = await supabase
          .from('artikel')
          .select('preis, bestand, lieferant');

        if (artikel && artikel.length > 0) {
          const totalValue = artikel.reduce(
            (sum, item) => sum + (item.preis || 0) * (item.bestand || 0),
            0
          );
          setInventoryValue(totalValue);
          setProductCount(artikel.length);

          const uniqueSuppliers = new Set(
            artikel.map((a) => a.lieferant).filter(Boolean)
          );
          setSupplierCount(uniqueSuppliers.size);
        }

        // Bewegungen der letzten 30 Tage aus artikel_log
        const { count: movementCount, error: logError } = await supabase
          .from('artikel_log')
          .select('*', { count: 'exact', head: true })
          .gte(
            'timestamp',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          );

        if (movementCount) setMovementCount(movementCount);
      } catch (error) {
        console.error('❌ Error fetching overview data:', error);
      }
    }

    fetchData();
  }, []);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
        </div>

        {/* KPI CARDS */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          
          {/* TOTAL INVENTORY VALUE */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Inventory Value</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                €{inventoryValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  Auto-updating
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                Live total inventory value
              </div>
              <div className='text-muted-foreground'>
                Based on current stock quantities
              </div>
            </CardFooter>
          </Card>

          {/* TOTAL PRODUCTS */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Products</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {productCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +{productCount > 0 ? 'OK' : '0'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                Total unique SKUs in system
              </div>
              <div className='text-muted-foreground'>
                Pulled from artikel table
              </div>
            </CardFooter>
          </Card>

          {/* SUPPLIERS */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Suppliers</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {supplierCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +{supplierCount > 0 ? 'OK' : '0'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                Unique supplier names
              </div>
              <div className='text-muted-foreground'>
                Extracted from artikel table
              </div>
            </CardFooter>
          </Card>

          {/* STOCK MOVEMENTS */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Stock Movements (30d)</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {movementCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  +{movementCount > 0 ? 'active' : '0'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                Movements logged this month
              </div>
              <div className='text-muted-foreground'>
                Data from artikel_log table
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* CHARTS SECTION */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
