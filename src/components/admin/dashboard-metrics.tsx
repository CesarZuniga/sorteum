'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { useState, useEffect } from 'react';

export function DashboardMetrics() {
  const firestore = useFirestore();
  const rafflesCollection = useMemoFirebase(() => collection(firestore, 'raffles'), [firestore]);
  const { data: raffles, isLoading: rafflesIsLoading } = useCollection<Raffle>(rafflesCollection);

  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  useEffect(() => {
    if (raffles && raffles.length > 0) {
      const fetchAllTickets = async () => {
        setTicketsLoading(true);
        const ticketPromises = raffles.map(raffle => 
            getDocs(query(collection(firestore, 'raffles', raffle.id, 'tickets')))
        );
        const ticketSnapshots = await Promise.all(ticketPromises);
        const tickets = ticketSnapshots.flatMap(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketType)));
        setAllTickets(tickets);
        setTicketsLoading(false);
      };
      fetchAllTickets();
    } else if (!rafflesIsLoading) {
        setTicketsLoading(false);
    }
  }, [raffles, firestore, rafflesIsLoading]);

  const totalRevenue = allTickets
    .filter(ticket => ticket.status === 'paid')
    .reduce((acc, ticket) => {
        const raffle = raffles?.find(r => r.id === ticket.raffleId);
        return acc + (raffle?.price || 0);
    }, 0);

  const totalTicketsSold = allTickets.filter(t => t.status === 'paid').length;
  
  const isLoading = rafflesIsLoading || ticketsLoading;
  const activeRaffles = raffles ? raffles.filter(r => r.active).length : 0;

  const metrics = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, loading: isLoading },
    { title: 'Active Raffles', value: activeRaffles, icon: Activity, loading: isLoading },
    { title: 'Tickets Sold (Paid)', value: totalTicketsSold, icon: Ticket, loading: isLoading },
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
            <div className="text-2xl font-bold">{metric.loading ? '...' : metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
