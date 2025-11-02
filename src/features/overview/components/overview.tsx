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
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

export default function OverViewPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* 👋 Begrüßung */}
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back
          </h2>
          <div className='hidden items-center space-x-2 md:flex'>
            <Button className='bg-amber-500 font-semibold text-black hover:bg-amber-600'>
              Download
            </Button>
          </div>
        </div>

        {/* 🧭 Tabs */}
        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='bg-card/40 border-border/40 w-fit rounded-xl border backdrop-blur-sm'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics' disabled>
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* 📊 Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            {/* 🟡 KPI-Cards */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:px-6 xl:grid-cols-4'>
              {[
                {
                  title: 'Total Revenue',
                  value: '$1,250.00',
                  desc: 'Trending up this month',
                  sub: 'Visitors for the last 6 months',
                  icon: <IconTrendingUp />,
                  change: '+12.5%'
                },
                {
                  title: 'New Customers',
                  value: '1,234',
                  desc: 'Down 20% this period',
                  sub: 'Acquisition needs attention',
                  icon: <IconTrendingDown />,
                  change: '-20%'
                },
                {
                  title: 'Active Accounts',
                  value: '45,678',
                  desc: 'Strong user retention',
                  sub: 'Engagement exceed targets',
                  icon: <IconTrendingUp />,
                  change: '+12.5%'
                },
                {
                  title: 'Growth Rate',
                  value: '4.5%',
                  desc: 'Steady performance increase',
                  sub: 'Meets growth projections',
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
