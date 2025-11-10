import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function RaffleMetrics({ raffle }: { raffle: Raffle }) {
  const firestore = useFirestore();
  const ticketsCollection = useMemoFirebase(() => collection(firestore, 'raffles', raffle.id, 'tickets'), [firestore, raffle.id]);

  const { data: tickets, isLoading } = useCollection<TicketType>(ticketsCollection);
  
  const [paidTickets, setPaidTickets] = useState(0);
  const [reservedTickets, setReservedTickets] = useState(0);
  
  useEffect(() => {
    if (tickets) {
        setPaidTickets(tickets.filter(t => t.status === 'paid').length);
        setReservedTickets(tickets.filter(t => t.status === 'reserved').length);
    }
  }, [tickets]);


  const availableTickets = tickets ? raffle.ticketCount - paidTickets - reservedTickets : raffle.ticketCount;
  
  const soldTickets = paidTickets + reservedTickets;
  const totalRevenue = paidTickets * raffle.price;
  const potentialRevenue = raffle.ticketCount * raffle.price;
  const salesProgress = (soldTickets / raffle.ticketCount) * 100;

  const metrics = [
    { title: 'Ingresos (Pagado)', value: formatCurrency(totalRevenue), icon: DollarSign },
    { title: 'Boletos Pagados', value: paidTickets, icon: CheckCircle },
    { title: 'Boletos Reservados', value: reservedTickets, icon: Clock },
    { title: 'Boletos Disponibles', value: availableTickets, icon: Ticket },
  ];

  return (
    <div className='space-y-4'>
        <Card>
            <CardHeader>
                <CardTitle>Progreso de Venta</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm">{isLoading ? '...' : soldTickets} de {raffle.ticketCount} boletos vendidos</span>
                    <span className="font-bold text-lg">{isLoading ? '...' : salesProgress.toFixed(0)}%</span>
                </div>
                <Progress value={isLoading ? 0 : salesProgress} />
                 <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>{formatCurrency(totalRevenue)}</span>
                    <span>{formatCurrency(potentialRevenue)}</span>
                </div>
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
                <div className="text-2xl font-bold">{isLoading ? '...' : metric.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
