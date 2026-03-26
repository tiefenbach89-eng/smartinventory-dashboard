'use client';

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
      <div className='flex flex-1 flex-col space-y-6 sm:space-y-8'>

        {/* ── Hero — Trade Republic portfolio header ── */}
        <div className='animate-fade-up pt-2'>
          <p className='text-muted-foreground mb-3 text-xs font-medium uppercase tracking-widest'>
            Smart Inventory · {t('welcome')}
          </p>

          {/* Primary value — the big number */}
          <div className='flex flex-wrap items-end gap-3'>
            <span className='font-numeric text-4xl font-bold tracking-tight sm:text-5xl'>
              {heroKpi.value}
            </span>
            <div className='mb-1 flex items-center gap-1.5'>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-sm font-semibold tabular-nums',
                  heroKpi.positive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {heroKpi.positive
                  ? <IconArrowUpRight className='h-4 w-4' />
                  : <IconArrowDownRight className='h-4 w-4' />}
                {heroKpi.change}
              </span>
              <span className='text-muted-foreground text-xs'>{heroKpi.sub}</span>
            </div>
          </div>

          <p className='text-muted-foreground mt-1 text-xs'>{heroKpi.title}</p>
        </div>

        {/* ── KPI Data Grid — financial table style ── */}
        <div className='animate-fade-up delay-50 overflow-hidden rounded-xl border border-border bg-card'>
          <div className='grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0'>
            {kpiCards.map((card) => (
              <div key={card.title} className='flex flex-col gap-1 px-4 py-4 sm:px-5'>
                <span className='text-muted-foreground truncate text-[11px] font-medium uppercase tracking-wider'>
                  {card.title}
                </span>
                <span className='font-numeric text-xl font-bold tracking-tight'>
                  {card.value}
                </span>
                <div className='flex items-center gap-1'>
                  {card.positive
                    ? <IconTrendingUp className='h-3 w-3 text-emerald-500' />
                    : <IconTrendingDown className='h-3 w-3 text-red-500' />}
                  <span
                    className={cn(
                      'text-[11px] font-semibold tabular-nums',
                      card.positive ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {card.change}
                  </span>
                  <span className='text-muted-foreground line-clamp-1 text-[11px]'>
                    {card.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Export button — right-aligned, minimal ── */}
        <div className='animate-fade-up delay-100 flex justify-end'>
          <Button
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 rounded-lg border-border text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            <IconDownload className='h-3.5 w-3.5' />
            {t('download')}
          </Button>
        </div>

        {/* ── Warnings ── */}
        <div className='animate-fade-up delay-100'>
          <LiquidWarnings />
        </div>

        {/* ── Area chart — full width, primary chart ── */}
        <div className='animate-fade-up delay-150 card-premium min-h-[320px] rounded-xl sm:min-h-[380px]'>
          <AreaGraph />
        </div>

        {/* ── Bar + Recent — side by side ── */}
        <div className='grid animate-fade-up delay-200 grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='card-premium min-h-[300px] rounded-xl sm:min-h-[360px]'>
            <BarGraph />
          </div>
          <div className='card-premium min-h-[300px] rounded-xl sm:min-h-[360px]'>
            <RecentSales />
          </div>
        </div>

        {/* ── Pie — full width on mobile, half on desktop ── */}
        <div className='animate-fade-up delay-250 card-premium min-h-[280px] rounded-xl sm:min-h-[340px]'>
          <PieGraph />
        </div>

      </div>
    </PageContainer>
  );
}
