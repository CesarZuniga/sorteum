import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { useState, useEffect } from 'react';

export function DashboardMetrics() {
  const firestore = useFirestore();
  const rafflesCollection = useMemoFirebase(() => collection(firestore, 'raffles'), [firestore]);
  const { data: raffles, isLoading } = useCollection<Raffle>(rafflesCollection);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);

  useEffect(() => {
    if (raffles) {
      const fetchMetrics = async () => {
        let revenue = 0;
        let ticketsSold = 0;
        for (const raffle of raffles) {
          const ticketsQuery = query(collection(firestore, 'raffles', raffle.id, 'tickets'), where('status', '==', 'paid'));
          const ticketsSnapshot = await getDocs(ticketsQuery);
          ticketsSold += ticketsSnapshot.size;
          revenue += ticketsSnapshot.size * raffle.price;
        }
        setTotalRevenue(revenue);
        setTotalTicketsSold(ticketsSold);
      };
      fetchMetrics();
    }
  }, [raffles, firestore]);

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
