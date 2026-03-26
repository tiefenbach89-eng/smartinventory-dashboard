'use client';

import PageContainer from '@/components/layout/page-container';
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
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const kpiColors = [
  {
    icon: 'text-indigo-500 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    border: 'border-indigo-500/15 dark:border-indigo-400/12',
    glow: 'dark:shadow-indigo-950/60',
    gradient: 'from-indigo-500/8 via-transparent to-transparent dark:from-indigo-500/12'
  },
  {
    icon: 'text-rose-500 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 dark:bg-rose-400/10',
    border: 'border-rose-500/15 dark:border-rose-400/12',
    glow: 'dark:shadow-rose-950/60',
    gradient: 'from-rose-500/8 via-transparent to-transparent dark:from-rose-500/12'
  },
  {
    icon: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    border: 'border-emerald-500/15 dark:border-emerald-400/12',
    glow: 'dark:shadow-emerald-950/60',
    gradient: 'from-emerald-500/8 via-transparent to-transparent dark:from-emerald-500/12'
  },
  {
    icon: 'text-violet-500 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 dark:bg-violet-400/10',
    border: 'border-violet-500/15 dark:border-violet-400/12',
    glow: 'dark:shadow-violet-950/60',
    gradient: 'from-violet-500/8 via-transparent to-transparent dark:from-violet-500/12'
  }
];

const kpiIcons = [IconPackage, IconArrowDown, IconArrowUp, IconUser];

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
  const t = useTranslations('Overview');

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
        console.error('Error fetching KPI data:', error);
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

  const cards = [
    {
      title: t('card1.title'),
      value: t('card1.value', { products: productCount, stock: totalStock }),
      desc: t('card1.desc'),
      sub: t('card1.sub')
    },
    {
      title: t('card2.title'),
      value: t('card2.value', { amount: totalWithdrawals }),
      desc: t('card2.desc'),
      sub: t('card2.sub')
    },
    {
      title: t('card3.title'),
      value: t('card3.value', { amount: totalAdded }),
      desc: t('card3.desc'),
      sub: t('card3.sub')
    },
    {
      title: t('card4.title'),
      value: activeUser || '—',
      desc: t('card4.desc'),
      sub: t('card4.sub', { count: activeUserCount })
    }
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12'>

        {/* ── Hero Greeting ── */}
        <div className='relative overflow-hidden rounded-2xl border border-primary/12 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent backdrop-blur-sm dark:border-primary/15 dark:from-primary/12 dark:via-primary/6'>
          {/* Grid pattern */}
          <div className='absolute inset-0 bg-grid-white/[0.025] [mask-image:radial-gradient(ellipse_at_top_left,white_30%,transparent_80%)]' />
          {/* Glow orb */}
          <div className='absolute -top-8 -left-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15' />

          <div className='relative px-6 py-7 sm:px-8 sm:py-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 backdrop-blur-sm dark:border-primary/25 dark:bg-primary/12'>
              <div className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
              <span className='text-xs font-semibold uppercase tracking-widest text-primary'>
                Dashboard
              </span>
            </div>
            <h1 className='mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl'>
              <span className='bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent'>
                {t('greeting', { name: displayName })}
              </span>
            </h1>
          </div>
        </div>

        {/* ── Liquid Warnings ── */}
        <LiquidWarnings />

        {/* ── KPI Cards ── */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {cards.map((kpi, i) => {
            const color = kpiColors[i];
            const Icon = kpiIcons[i];

            return (
              <div
                key={i}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm',
                  'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
                  color.border,
                  color.glow
                )}
              >
                {/* Card gradient */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-100', color.gradient)} />

                <div className='relative space-y-4'>
                  {/* Header */}
                  <div className='flex items-center justify-between'>
                    <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                      {kpi.title}
                    </p>
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color.iconBg)}>
                      <Icon className={cn('h-4 w-4', color.icon)} />
                    </div>
                  </div>

                  {/* Value */}
                  <p className='text-2xl font-black tracking-tight'>
                    {kpi.value}
                  </p>

                  {/* Footer */}
                  <div className='border-t border-border/40 pt-3'>
                    <p className='text-xs font-semibold text-foreground/70'>{kpi.desc}</p>
                    <p className='mt-0.5 text-[11px] text-muted-foreground'>{kpi.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts ── */}
        <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2'>
          {[bar_stats, sales, area_stats, pie_stats].map((chart, i) => (
            <div
              key={i}
              className='relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-border/40'
            >
              {chart}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
