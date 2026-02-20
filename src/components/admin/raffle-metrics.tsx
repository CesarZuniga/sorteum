'use client';
import type { Raffle } from '@/lib/definitions';
import type { TicketStatusCounts } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { getTicketStatusCounts } from '@/lib/data';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/fade-in';


export function RaffleMetrics({ raffle, refreshTrigger }: { raffle: Raffle; refreshTrigger?: number }) {
  const t = useTranslations('Admin');
  const [counts, setCounts] = useState<TicketStatusCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      setIsLoading(true);
      try {
        const data = await getTicketStatusCounts(raffle.id);
        setCounts(data);
      } catch (error) {
        console.error('Error loading ticket counts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCounts();
  }, [raffle.id, refreshTrigger]);

  const paidTickets = counts?.paid ?? 0;
  const reservedTickets = counts?.reserved ?? 0;
  const availableTickets = counts?.available ?? 0;

  const soldTickets = paidTickets + reservedTickets;
  const totalRevenue = paidTickets * raffle.price;
  const potentialRevenue = raffle.ticketCount * raffle.price;
  const salesProgress = raffle.ticketCount > 0 ? (soldTickets / raffle.ticketCount) * 100 : 0;

  const metrics = [
    { title: t('raffleMetricsRevenuePaid'), value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoading, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: t('raffleMetricsPaidTickets'), value: paidTickets, icon: CheckCircle, loading: isLoading, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    { title: t('raffleMetricsReservedTickets'), value: reservedTickets, icon: Clock, loading: isLoading, iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    { title: t('raffleMetricsAvailableTickets'), value: availableTickets, icon: Ticket, loading: isLoading, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
  ];

  return (
    <div className='space-y-4'>
        <FadeIn>
        <Card>
            <CardHeader>
                <CardTitle>{t('raffleMetricsSalesProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="h-6 w-full rounded-md animate-shimmer" /> :
                (<>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-sm">
                          {t.rich('raffleMetricsSoldTickets', {
                            soldTickets: soldTickets,
                            totalTickets: raffle.ticketCount,
                          })}
                        </span>
                        <span className="font-bold text-lg">{salesProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={salesProgress} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-orange-400" />
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{formatCurrency(totalRevenue)}</span>
                        <span>{formatCurrency(potentialRevenue)}</span>
                    </div>
                </>)}
            </CardContent>
        </Card>
        </FadeIn>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
            <FadeIn key={index} delay={index * 100}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${metric.iconBg}`}>
                  <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                {metric.loading ? (
                  <div className="h-8 w-24 rounded-md animate-shimmer" />
                ) : (
                  <div className="text-2xl font-bold">{metric.value}</div>
                )}
            </CardContent>
            </Card>
            </FadeIn>
        ))}
        </div>
    </div>
  );
}
