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

// 🌍 next-intl
import { useTranslations } from 'next-intl';

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

  const t = useTranslations('Overview'); // <– NEW

  const [productCount, setProductCount] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalAdded, setTotalAdded] = useState(0);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [activeUserCount, setActiveUserCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: artikel } = await supabase
          .from('artikel')
          .select('bestand');
        setProductCount(artikel?.length || 0);
        setTotalStock(
          artikel?.reduce((sum, a) => sum + (a.bestand || 0), 0) || 0
        );

        const since = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: withdrawals } = await supabase
          .from('artikel_log')
          .select('menge_diff')
          .lt('menge_diff', 0)
          .gte('timestamp', since);

        setTotalWithdrawals(
          withdrawals?.reduce(
            (sum, w) => sum + Math.abs(w.menge_diff || 0),
            0
          ) || 0
        );

        const { data: additions } = await supabase
          .from('artikel_log')
          .select('menge_diff')
          .gt('menge_diff', 0)
          .gte('timestamp', since);

        setTotalAdded(
          additions?.reduce((sum, a) => sum + (a.menge_diff || 0), 0) || 0
        );

        const { data: userActivity } = await supabase
          .from('artikel_log')
          .select('benutzer')
          .gte('timestamp', since);

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

  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : user?.email || t('guest');

  // 🚀 KPI Daten strukturieren
  const cards = [
    {
      icon: <IconPackage className='mr-1' />,
      badge: t('card1.badge'),
      title: t('card1.title'),
      value: t('card1.value', {
        products: productCount,
        stock: totalStock
      }),
      desc: t('card1.desc'),
      sub: t('card1.sub')
    },
    {
      icon: <IconArrowDown className='mr-1' />,
      badge: t('card2.badge'),
      title: t('card2.title'),
      value: t('card2.value', {
        amount: totalWithdrawals
      }),
      desc: t('card2.desc'),
      sub: t('card2.sub')
    },
    {
      icon: <IconArrowUp className='mr-1' />,
      badge: t('card3.badge'),
      title: t('card3.title'),
      value: t('card3.value', {
        amount: totalAdded
      }),
      desc: t('card3.desc'),
      sub: t('card3.sub')
    },
    {
      icon: <IconUser className='mr-1' />,
      badge: t('card4.badge', { count: activeUserCount }),
      title: t('card4.title'),
      value: activeUser || '—',
      desc: t('card4.desc'),
      sub: t('card4.sub')
    }
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {t('greeting', { name: displayName })}
          </h2>
        </div>

        {/* KPI Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {cards.map((kpi, i) => (
            <Card
              key={i}
              className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/20 rounded-2xl border bg-gradient-to-b shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg'
            >
              <CardHeader>
                <CardDescription>{kpi.title}</CardDescription>
                <CardTitle className='text-2xl font-semibold'>
                  {kpi.value}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant='outline'
                    className='border-primary text-primary flex items-center'
                  >
                    {kpi.icon}
                    {kpi.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='font-medium'>{kpi.desc}</div>
                <div className='text-muted-foreground'>{kpi.sub}</div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 items-stretch gap-6 md:grid-cols-2'>
          {[bar_stats, sales, area_stats, pie_stats].map((chart, i) => (
            <div
              key={i}
              className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/20 flex h-full min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg'
            >
              {chart}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
