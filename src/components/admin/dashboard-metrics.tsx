'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { getRaffles, getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';

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
    { title: t('totalRevenue'), value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoading },
    { title: t('activeRaffles'), value: activeRaffles, icon: Activity, loading: isLoading },
    { title: t('ticketsSold'), value: totalTicketsSold, icon: Ticket, loading: isLoading },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metric.loading ? (
                <div className="text-2xl font-bold">...</div>
            ) : (
                <div className="text-2xl font-bold">{metric.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}