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
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

export default function OverViewPage() {
  const t = useTranslations('overview');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* 👋 Begrüßung */}
        <div className='flex items-center justify-between gap-4'>
          <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>{t('welcome')}</h2>
          <div className='flex items-center space-x-2'>
            <Button className='h-11 min-w-[44px] rounded-xl bg-amber-500 px-4 font-semibold text-black active:scale-95 sm:h-10'>
              {t('download')}
            </Button>
          </div>
        </div>

        {/* 🧭 Tabs */}
        <Tabs defaultValue='overview' className='space-y-5'>
          <TabsList className='bg-card/60 border-border/40 h-11 w-fit rounded-xl border backdrop-blur-sm'>
            <TabsTrigger value='overview' className='h-9 rounded-lg px-4 text-sm font-medium'>
              {t('tabOverview')}
            </TabsTrigger>
            <TabsTrigger value='analytics' disabled className='h-9 rounded-lg px-4 text-sm font-medium'>
              {t('tabAnalytics')}
            </TabsTrigger>
          </TabsList>

          {/* 📊 Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* 🚨 Flüssigkeits-Warnungen */}
            <LiquidWarnings />

            {/* 🟡 KPI-Cards — 2 cols on mobile, 4 on desktop */}
            <div className='grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 xl:grid-cols-4'>
              {[
                {
                  title: t('kpiRevenueTitle'),
                  value: '$1,250.00',
                  desc: t('kpiRevenueDesc'),
                  sub: t('kpiRevenueSub'),
                  icon: <IconTrendingUp className='h-3.5 w-3.5' />,
                  change: '+12.5%',
                  positive: true
                },
                {
                  title: t('kpiCustomersTitle'),
                  value: '1,234',
                  desc: t('kpiCustomersDesc'),
                  sub: t('kpiCustomersSub'),
                  icon: <IconTrendingDown className='h-3.5 w-3.5' />,
                  change: '-20%',
                  positive: false
                },
                {
                  title: t('kpiAccountsTitle'),
                  value: '45,678',
                  desc: t('kpiAccountsDesc'),
                  sub: t('kpiAccountsSub'),
                  icon: <IconTrendingUp className='h-3.5 w-3.5' />,
                  change: '+12.5%',
                  positive: true
                },
                {
                  title: t('kpiGrowthTitle'),
                  value: '4.5%',
                  desc: t('kpiGrowthDesc'),
                  sub: t('kpiGrowthSub'),
                  icon: <IconTrendingUp className='h-3.5 w-3.5' />,
                  change: '+4.5%',
                  positive: true
                }
              ].map((card, i) => (
                <Card
                  key={i}
                  className='touch-press border-border/40 from-card/80 to-card/40 cursor-default rounded-2xl border bg-gradient-to-b shadow-sm backdrop-blur-sm'
                >
                  <CardHeader className='p-4 pb-2 sm:p-5'>
                    <CardDescription className='text-xs font-medium sm:text-sm'>{card.title}</CardDescription>
                    <CardTitle className='text-xl font-bold tabular-nums sm:text-2xl'>
                      {card.value}
                    </CardTitle>
                    <CardAction>
                      <Badge
                        variant='outline'
                        className={`flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-semibold ${
                          card.positive
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {card.icon}
                        {card.change}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className='hidden flex-col items-start gap-1 p-4 pt-0 text-xs sm:flex sm:p-5 sm:pt-0'>
                    <div className='line-clamp-1 flex gap-1.5 font-medium'>
                      {card.desc}
                    </div>
                    <div className='text-muted-foreground line-clamp-1'>{card.sub}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* 📈 Charts — single col on mobile, 2 cols on tablet+ */}
            <div className='grid grid-cols-1 items-stretch gap-4 sm:gap-5 md:grid-cols-2'>
              <div className='border-border/40 from-card/80 to-card/40 flex h-full min-h-[320px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur-sm sm:min-h-[380px] md:min-h-[420px]'>
                <BarGraph />
              </div>

              <div className='border-border/40 from-card/80 to-card/40 flex h-full min-h-[320px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur-sm sm:min-h-[380px] md:min-h-[420px]'>
                <RecentSales />
              </div>

              <div className='border-border/40 from-card/80 to-card/40 flex h-full min-h-[300px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur-sm sm:min-h-[360px] md:min-h-[420px]'>
                <AreaGraph />
              </div>

              <div className='border-border/40 from-card/80 to-card/40 flex h-full min-h-[300px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur-sm sm:min-h-[360px] md:min-h-[420px]'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
