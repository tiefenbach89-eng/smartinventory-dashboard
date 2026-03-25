'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AreaGraph from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import { LiquidWarnings } from './liquid-warnings';
import { IconTrendingUp, IconTrendingDown, IconDownload } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

export default function OverViewPage() {
  const t = useTranslations('overview');

  const kpiCards = [
    {
      title: t('kpiRevenueTitle'),
      value: '$1,250.00',
      desc: t('kpiRevenueDesc'),
      sub: t('kpiRevenueSub'),
      icon: <IconTrendingUp className='h-3.5 w-3.5' />,
      change: '+12.5%',
      positive: true,
      delay: 'delay-100'
    },
    {
      title: t('kpiCustomersTitle'),
      value: '1,234',
      desc: t('kpiCustomersDesc'),
      sub: t('kpiCustomersSub'),
      icon: <IconTrendingDown className='h-3.5 w-3.5' />,
      change: '-20%',
      positive: false,
      delay: 'delay-150'
    },
    {
      title: t('kpiAccountsTitle'),
      value: '45,678',
      desc: t('kpiAccountsDesc'),
      sub: t('kpiAccountsSub'),
      icon: <IconTrendingUp className='h-3.5 w-3.5' />,
      change: '+12.5%',
      positive: true,
      delay: 'delay-200'
    },
    {
      title: t('kpiGrowthTitle'),
      value: '4.5%',
      desc: t('kpiGrowthDesc'),
      sub: t('kpiGrowthSub'),
      icon: <IconTrendingUp className='h-3.5 w-3.5' />,
      change: '+4.5%',
      positive: true,
      delay: 'delay-250'
    }
  ];

  return (
    <PageContainer>
      <div className='ambient-gradient flex flex-1 flex-col space-y-5 sm:space-y-6'>

        {/* ── Header ── */}
        <div className='animate-fade-up flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>
              {t('welcome')}
            </h2>
            <p className='text-muted-foreground mt-0.5 text-xs sm:text-sm'>
              Smart Inventory · Live
            </p>
          </div>
          <Button className='glow-amber-sm h-11 min-w-[44px] rounded-xl bg-primary px-5 font-semibold text-primary-foreground active:scale-95 sm:h-10'>
            <IconDownload className='mr-1.5 h-4 w-4' />
            {t('download')}
          </Button>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue='overview' className='space-y-5'>
          <TabsList className='animate-fade-in delay-50 bg-card/80 border-border/60 h-11 w-fit rounded-xl border shadow-sm backdrop-blur-md'>
            <TabsTrigger
              value='overview'
              className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 rounded-lg px-5 text-sm font-semibold transition-all'
            >
              {t('tabOverview')}
            </TabsTrigger>
            <TabsTrigger
              value='analytics'
              disabled
              className='h-9 rounded-lg px-5 text-sm font-medium opacity-40'
            >
              {t('tabAnalytics')}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab Content ── */}
          <TabsContent value='overview' className='space-y-5 sm:space-y-6'>

            {/* Warnings */}
            <div className='animate-fade-up delay-100'>
              <LiquidWarnings />
            </div>

            {/* KPI Cards — 2 col mobile / 4 col desktop */}
            <div className='grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4'>
              {kpiCards.map((card, i) => (
                <Card
                  key={i}
                  className={`card-premium touch-press animate-fade-up ${card.delay} group relative cursor-default overflow-hidden rounded-2xl`}
                >
                  {/* Amber top-line accent on active / primary card */}
                  {card.positive && i === 0 && (
                    <div className='absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0' />
                  )}

                  <CardHeader className='p-4 pb-2 sm:p-5 sm:pb-3'>
                    <CardDescription className='text-muted-foreground text-[11px] font-semibold uppercase tracking-wider sm:text-xs'>
                      {card.title}
                    </CardDescription>
                    <CardTitle className='font-numeric mt-1 text-xl font-bold sm:text-2xl'>
                      {card.value}
                    </CardTitle>
                    <CardAction>
                      <Badge
                        variant='outline'
                        className={`flex items-center gap-0.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                          card.positive
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-400'
                            : 'border-red-500/25 bg-red-500/10 text-red-600 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-400'
                        }`}
                      >
                        {card.icon}
                        {card.change}
                      </Badge>
                    </CardAction>
                  </CardHeader>

                  <CardFooter className='hidden flex-col items-start gap-0.5 p-4 pt-0 sm:flex sm:p-5 sm:pt-0'>
                    <div className='text-foreground/80 line-clamp-1 text-xs font-semibold'>
                      {card.desc}
                    </div>
                    <div className='text-muted-foreground line-clamp-1 text-xs'>
                      {card.sub}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Charts — single col mobile / 2 col tablet+ */}
            <div className='grid grid-cols-1 items-stretch gap-4 sm:gap-5 md:grid-cols-2'>
              <div className='animate-fade-up delay-200 card-premium flex h-full min-h-[300px] flex-col rounded-2xl p-1 sm:min-h-[360px] md:min-h-[420px]'>
                <BarGraph />
              </div>

              <div className='animate-fade-up delay-250 card-premium flex h-full min-h-[300px] flex-col rounded-2xl p-1 sm:min-h-[360px] md:min-h-[420px]'>
                <RecentSales />
              </div>

              <div className='animate-fade-up delay-300 card-premium flex h-full min-h-[280px] flex-col rounded-2xl p-1 sm:min-h-[340px] md:min-h-[420px]'>
                <AreaGraph />
              </div>

              <div className='animate-fade-up delay-350 card-premium flex h-full min-h-[280px] flex-col rounded-2xl p-1 sm:min-h-[340px] md:min-h-[420px]'>
                <PieGraph />
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
