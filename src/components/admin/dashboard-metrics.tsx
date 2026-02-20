'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { getRaffles, getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/fade-in';

export function DashboardMetrics() {
  const t = useTranslations('Admin');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const rafflesData = await getRaffles();
      setRaffles(rafflesData);

      const ticketsPromises = rafflesData.map(r => getTicketsByRaffleId(r.id));
      const ticketsArrays = await Promise.all(ticketsPromises);
      setAllTickets(ticketsArrays.flat());

      setIsLoading(false);
    }
    loadData();
  }, []);

  const paidTickets = useMemo(() => allTickets.filter(t => t.status === 'paid'), [allTickets]);

  const totalRevenue = useMemo(() => {
    if (!paidTickets || !raffles) return 0;

    return paidTickets.reduce((acc, ticket) => {
        const raffle = raffles.find(r => r.id === ticket.raffleId);
        return acc + (raffle?.price || 0);
      }, 0);

  }, [paidTickets, raffles]);

  const totalTicketsSold = paidTickets?.length ?? 0;

  const activeRaffles = useMemo(() => {
    if (!raffles) return 0;
    return raffles.filter(r => r.active).length;
  }, [raffles]);

  const metrics = [
    { title: t('totalRevenue'), value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoading, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: t('activeRaffles'), value: activeRaffles, icon: Activity, loading: isLoading, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    { title: t('ticketsSold'), value: totalTicketsSold, icon: Ticket, loading: isLoading, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
