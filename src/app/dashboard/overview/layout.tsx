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
import {
  IconUser,
  IconArrowDown,
  IconArrowUp,
  IconPackage
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

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
  const user = useUser();

  // 🧠 States für KPIs
  const [productCount, setProductCount] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalAdded, setTotalAdded] = useState(0);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeUserCount, setActiveUserCount] = useState(0);

  // 📦 KPI-Daten laden
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: artikel, error: artikelError } = await supabase
          .from('artikel')
          .select('bestand');

        if (artikelError) throw artikelError;
        setProductCount(artikel.length);
        setTotalStock(artikel.reduce((sum, a) => sum + (a.bestand || 0), 0));

        const since = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('artikel_log')
          .select('menge_diff')
          .lt('menge_diff', 0)
          .gte('timestamp', since);

        if (withdrawalsError) throw withdrawalsError;
        setTotalWithdrawals(
          withdrawals?.reduce(
            (sum, w) => sum + Math.abs(w.menge_diff || 0),
            0
          ) || 0
        );

        const { data: additions, error: additionsError } = await supabase
          .from('artikel_log')
          .select('menge_diff')
          .gt('menge_diff', 0)
          .gte('timestamp', since);

        if (additionsError) throw additionsError;
        setTotalAdded(
          additions?.reduce((sum, a) => sum + (a.menge_diff || 0), 0) || 0
        );

        const { data: userActivity, error: userError } = await supabase
          .from('artikel_log')
          .select('benutzer')
          .gte('timestamp', since);

        if (userError) throw userError;
        if (userActivity && userActivity.length > 0) {
          const counts: Record<string, number> = {};
          for (const log of userActivity) {
            if (!log.benutzer) continue;
            counts[log.benutzer] = (counts[log.benutzer] || 0) + 1;
          }
          const topUser = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (topUser) {
            setActiveUser(topUser[0]);
            setActiveUserCount(topUser[1]);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching KPI data:', error);
      }
    }

    fetchData();
  }, [supabase]);

  // 🧑‍💼 Nutzername zusammensetzen
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : user?.email || 'Guest';

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        {/* 👋 Begrüßung */}
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, {displayName} 👋
          </h2>
        </div>

        {/* 📦 KPI CARDS */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {/* 1️⃣ Total Products & Stock */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Products & Stock</CardDescription>
              <CardTitle className='text-2xl font-semibold @[250px]/card:text-3xl'>
                {productCount} Products / {totalStock} Units
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconPackage className='mr-1' />
                  OK
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='font-medium'>
                Current active SKUs and total quantity
              </div>
              <div className='text-muted-foreground'>
                Pulled live from artikel table
              </div>
            </CardFooter>
          </Card>

          {/* 2️⃣ Total Withdrawals */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Withdrawals (30d)</CardDescription>
              <CardTitle className='text-2xl font-semibold @[250px]/card:text-3xl'>
                {totalWithdrawals} pcs removed
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconArrowDown className='mr-1' />
                  30d
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='font-medium'>
                Items withdrawn in the last 30 days
              </div>
              <div className='text-muted-foreground'>
                Based on artikel_log movements
              </div>
            </CardFooter>
          </Card>

          {/* 3️⃣ Total Added */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total Added (30d)</CardDescription>
              <CardTitle className='text-2xl font-semibold @[250px]/card:text-3xl'>
                {totalAdded} pcs added
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconArrowUp className='mr-1' />
                  30d
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='font-medium'>
                Items restocked in the last 30 days
              </div>
              <div className='text-muted-foreground'>
                Based on artikel_log additions
              </div>
            </CardFooter>
          </Card>

          {/* 4️⃣ Most Active User */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Most Active User (30d)</CardDescription>
              <CardTitle className='text-2xl font-semibold @[250px]/card:text-3xl'>
                {activeUser ? activeUser : '—'}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUser className='mr-1' />
                  {activeUserCount} actions
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='font-medium'>Top user by logged movements</div>
              <div className='text-muted-foreground'>
                Tracks 30-day user activity
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 📊 Charts */}
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
