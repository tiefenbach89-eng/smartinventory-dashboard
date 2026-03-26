'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import AreaGraph from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { LiquidWarnings } from './liquid-warnings';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconDownload,
  IconArrowUpRight,
  IconArrowDownRight
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function OverViewPage() {
  const t = useTranslations('overview');

  /* ── Date greeting ── */
  const today = React.useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const kpiCards = [
    {
      title: t('kpiRevenueTitle'),
      value: '$1,250.00',
      sub: t('kpiRevenueSub'),
      change: '+12.5%',
      positive: true
    },
    {
      title: t('kpiCustomersTitle'),
      value: '1,234',
      sub: t('kpiCustomersSub'),
      change: '-20%',
      positive: false
    },
    {
      title: t('kpiAccountsTitle'),
      value: '45,678',
      sub: t('kpiAccountsSub'),
      change: '+12.5%',
      positive: true
    },
    {
      title: t('kpiGrowthTitle'),
      value: '4.5%',
      sub: t('kpiGrowthSub'),
      change: '+4.5%',
      positive: true
    }
  ];

  const heroKpi = kpiCards[0];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-8 lg:gap-10'>

        {/* ══════════════════════════════════════════
            HERO — Trade Republic portfolio header
            ══════════════════════════════════════════ */}
        <section className='animate-fade-up'>
          {/* Date line */}
          <p className='text-muted-foreground text-xs font-medium tracking-wide'>
            {today}
          </p>

          {/* Primary value */}
          <div className='mt-3 flex flex-wrap items-end gap-x-4 gap-y-1'>
            <span className='font-numeric text-5xl font-bold tracking-tight lg:text-6xl'>
              {heroKpi.value}
            </span>

            <div className='mb-1.5 flex flex-col gap-0.5'>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-base font-semibold tabular-nums',
                  heroKpi.positive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {heroKpi.positive
                  ? <IconArrowUpRight className='h-5 w-5' />
                  : <IconArrowDownRight className='h-5 w-5' />
                }
                {heroKpi.change}
              </span>
              <span className='text-muted-foreground text-xs'>{heroKpi.sub}</span>
            </div>
          </div>

          {/* Label */}
          <p className='text-muted-foreground mt-1 text-sm'>
            {heroKpi.title} · Smart Inventory
          </p>
        </section>

        {/* ══════════════════════════════════════════
            KPI TABLE — financial data row style
            ══════════════════════════════════════════ */}
        <section className='animate-fade-up delay-50'>
          <div className='overflow-hidden rounded-xl border border-border bg-card'>
            {/* Mobile: 2×2 grid | Desktop: single row */}
            <div className='grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-border sm:[&>*:nth-child(n+3)]:border-t-0'>
              {kpiCards.map((card) => (
                <div key={card.title} className='flex flex-col gap-1.5 px-5 py-5'>
                  <span className='text-muted-foreground text-[11px] font-medium uppercase tracking-wider'>
                    {card.title}
                  </span>
                  <span className='font-numeric text-2xl font-bold leading-none tracking-tight'>
                    {card.value}
                  </span>
                  <div className='flex items-center gap-1.5'>
                    {card.positive
                      ? <IconTrendingUp className='h-3.5 w-3.5 shrink-0 text-emerald-500' />
                      : <IconTrendingDown className='h-3.5 w-3.5 shrink-0 text-red-500' />
                    }
                    <span className={cn(
                      'text-xs font-semibold tabular-nums',
                      card.positive ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {card.change}
                    </span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {card.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            ACTION BAR
            ══════════════════════════════════════════ */}
        <div className='animate-fade-up delay-100 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-foreground/70 uppercase tracking-widest'>
            {t('tabOverview')}
          </h2>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground'
          >
            <IconDownload className='h-3.5 w-3.5' />
            {t('download')}
          </Button>
        </div>

        {/* ══════════════════════════════════════════
            WARNINGS
            ══════════════════════════════════════════ */}
        <div className='animate-fade-up delay-100'>
          <LiquidWarnings />
        </div>

        {/* ══════════════════════════════════════════
            PRIMARY CHART — full width area
            ══════════════════════════════════════════ */}
        <section className='animate-fade-up delay-150 overflow-hidden rounded-2xl border border-border bg-card'>
          <AreaGraph />
        </section>

        {/* ══════════════════════════════════════════
            SECONDARY CHARTS — 2-column
            ══════════════════════════════════════════ */}
        <section className='animate-fade-up delay-200 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5'>
          <div className='overflow-hidden rounded-2xl border border-border bg-card'>
            <BarGraph />
          </div>
          <div className='overflow-hidden rounded-2xl border border-border bg-card'>
            <RecentSales />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TERTIARY CHART — full width
            ══════════════════════════════════════════ */}
        <section className='animate-fade-up delay-250 overflow-hidden rounded-2xl border border-border bg-card'>
          <PieGraph />
        </section>

      </div>
    </PageContainer>
  );
}
