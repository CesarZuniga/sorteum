
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';

export function DashboardMetrics() {
  const firestore = useFirestore();

  const rafflesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'raffles') : null), [firestore]);
  const { data: raffles, isLoading: isLoadingRaffles } = useCollection<Raffle>(rafflesQuery);
  
  const paidTicketsQuery = useMemoFirebase(() => (firestore ? query(collectionGroup(firestore, 'tickets'), where('status', '==', 'paid')) : null), [firestore]);
  const { data: paidTickets, isLoading: isLoadingTickets } = useCollection<TicketType>(paidTicketsQuery);

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
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoadingRaffles || isLoadingTickets },
    { title: 'Active Raffles', value: activeRaffles, icon: Activity, loading: isLoadingRaffles },
    { title: 'Tickets Sold (Paid)', value: totalTicketsSold, icon: Ticket, loading: isLoadingTickets },
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
