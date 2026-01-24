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
import { LiquidWarnings } from '@/features/overview/components/liquid-warnings';

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
      <div className='flex flex-1 flex-col space-y-8 px-6 py-8 sm:px-8 md:px-12 md:py-12'>
        {/* iOS-Style Hero Greeting */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 backdrop-blur-xl'>
          <div className='absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]' />
          <div className='relative space-y-2'>
            <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 backdrop-blur-sm'>
              <IconUser className='h-4 w-4 text-primary' />
              <span className='text-xs font-semibold uppercase tracking-wider text-primary'>
                Dashboard
              </span>
            </div>
            <h1 className='text-4xl font-black tracking-tight sm:text-5xl'>
              <span className='bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent'>
                {t('greeting', { name: displayName })}
              </span>
            </h1>
          </div>
        </div>

        {/* 🚨 Flüssigkeits-Warnungen */}
        <LiquidWarnings />

        {/* iOS-Style KPI Cards */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {cards.map((kpi, i) => (
            <Card
              key={i}
              className='group relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl'
            >
              {/* Subtle Pattern */}
              <div className='absolute inset-0 -z-10 opacity-[0.02]'>
                <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
              </div>

              {/* Gradient Overlay on Hover */}
              <div className='absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
                <div
                  className='absolute inset-0'
                  style={{
                    background: `radial-gradient(circle at 30% 20%, rgba(var(--primary), 0.1) 0%, transparent 60%)`
                  }}
                />
              </div>

              <CardHeader className='space-y-3 p-0'>
                <div className='flex items-center justify-between'>
                  <CardDescription className='text-muted-foreground text-sm font-bold uppercase tracking-wider'>
                    {kpi.title}
                  </CardDescription>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner backdrop-blur-sm'>
                    {kpi.icon}
                  </div>
                </div>
                <CardTitle className='text-3xl font-black tracking-tight'>
                  {kpi.value}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant='outline'
                    className='border-primary/20 bg-primary/5 text-primary flex items-center gap-1.5 rounded-xl border-2 px-3 py-1 font-bold shadow-sm'
                  >
                    {kpi.icon}
                    {kpi.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='mt-4 flex-col items-start gap-2 border-t border-border/10 p-0 pt-4 text-sm'>
                <div className='font-bold'>{kpi.desc}</div>
                <div className='text-muted-foreground text-xs font-semibold'>{kpi.sub}</div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* iOS-Style Charts */}
        <div className='grid grid-cols-1 items-stretch gap-6 md:grid-cols-2'>
          {[bar_stats, sales, area_stats, pie_stats].map((chart, i) => (
            <div
              key={i}
              className='relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl'
            >
              {/* Subtle Pattern */}
              <div className='absolute inset-0 -z-10 opacity-[0.02]'>
                <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
              </div>
              {chart}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
