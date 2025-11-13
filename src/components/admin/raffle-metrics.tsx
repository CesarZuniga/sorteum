'use client';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo, useEffect } from 'react';
import { getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';


export function RaffleMetrics({ raffle }: { raffle: Raffle }) {
  const t = useTranslations('Admin');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      const ticketsData = await getTicketsByRaffleId(raffle.id);
      setTickets(ticketsData);
      setIsLoading(false);
    }
    loadTickets();
  }, [raffle.id]);

  const paidTickets = useMemo(() => tickets.filter(t => t.status === 'paid').length, [tickets]);
  const reservedTickets = useMemo(() => tickets.filter(t => t.status === 'reserved').length, [tickets]);
  const availableTickets = useMemo(() => raffle.ticketCount - paidTickets - reservedTickets, [raffle.ticketCount, paidTickets, reservedTickets]);
  
  const soldTickets = paidTickets + reservedTickets;
  const totalRevenue = paidTickets * raffle.price;
  const potentialRevenue = raffle.ticketCount * raffle.price;
  const salesProgress = soldTickets > 0 ? (soldTickets / raffle.ticketCount) * 100 : 0;

  const metrics = [
    { title: t('raffleMetricsRevenuePaid'), value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoading },
    { title: t('raffleMetricsPaidTickets'), value: paidTickets, icon: CheckCircle, loading: isLoading },
    { title: t('raffleMetricsReservedTickets'), value: reservedTickets, icon: Clock, loading: isLoading },
    { title: t('raffleMetricsAvailableTickets'), value: availableTickets, icon: Ticket, loading: isLoading },
  ];

  return (
    <div className='space-y-4'>
        <Card>
            <CardHeader>
                <CardTitle>{t('raffleMetricsSalesProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>{t('raffleMetricsLoadingProgress')}</p> :
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
                    <Progress value={salesProgress} />
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{formatCurrency(totalRevenue)}</span>
                        <span>{formatCurrency(potentialRevenue)}</span>
                    </div>
                </>)}
            </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
            <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{metric.loading ? '...' : metric.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}