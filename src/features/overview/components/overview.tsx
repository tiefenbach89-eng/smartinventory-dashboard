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
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>{t('welcome')}</h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button className='bg-amber-500 font-semibold text-black hover:bg-amber-600'>
              {t('download')}
            </Button>
          </div>
        </div>

        {/* 🧭 Tabs */}
        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='bg-card/40 border-border/40 w-fit rounded-xl border backdrop-blur-sm'>
            <TabsTrigger value='overview'>{t('tabOverview')}</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              {t('tabAnalytics')}
            </TabsTrigger>
          </TabsList>

          {/* 📊 Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* 🚨 Flüssigkeits-Warnungen */}
            <LiquidWarnings />

            {/* 🟡 KPI-Cards */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:px-6 xl:grid-cols-4'>
              {[
                {
                  title: t('kpiRevenueTitle'),
                  value: '$1,250.00',
                  desc: t('kpiRevenueDesc'),
                  sub: t('kpiRevenueSub'),
                  icon: <IconTrendingUp />,
                  change: '+12.5%'
                },
                {
                  title: t('kpiCustomersTitle'),
                  value: '1,234',
                  desc: t('kpiCustomersDesc'),
                  sub: t('kpiCustomersSub'),
                  icon: <IconTrendingDown />,
                  change: '-20%'
                },
                {
                  title: t('kpiAccountsTitle'),
                  value: '45,678',
                  desc: t('kpiAccountsDesc'),
                  sub: t('kpiAccountsSub'),
                  icon: <IconTrendingUp />,
                  change: '+12.5%'
                },
                {
                  title: t('kpiGrowthTitle'),
                  value: '4.5%',
                  desc: t('kpiGrowthDesc'),
                  sub: t('kpiGrowthSub'),
                  icon: <IconTrendingUp />,
                  change: '+4.5%'
                }
              ].map((card, i) => (
                <Card
                  key={i}
                  className='border-border/40 from-card/70 to-background/20 rounded-2xl border bg-gradient-to-b shadow-sm backdrop-blur md:shadow-md'
                >
                  <CardHeader>
                    <CardDescription>{card.title}</CardDescription>
                    <CardTitle className='text-2xl font-semibold tabular-nums'>
                      {card.value}
                    </CardTitle>
                    <CardAction>
                      <Badge variant='outline' className='flex items-center'>
                        {card.icon}
                        {card.change}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                    <div className='line-clamp-1 flex gap-2 font-medium'>
                      {card.desc} {card.icon}
                    </div>
                    <div className='text-muted-foreground'>{card.sub}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* 📈 Charts */}
            <div className='grid grid-cols-1 items-stretch gap-6 md:grid-cols-2'>
              <div className='border-border/40 from-card/70 to-background/20 flex h-full min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur'>
                <BarGraph />
              </div>

              <div className='border-border/40 from-card/70 to-background/20 flex h-full min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur'>
                <RecentSales />
              </div>

              <div className='border-border/40 from-card/70 to-background/20 flex h-full min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur'>
                <AreaGraph />
              </div>

              <div className='border-border/40 from-card/70 to-background/20 flex h-full min-h-[420px] flex-col rounded-2xl border bg-gradient-to-b p-1 shadow-md backdrop-blur'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
