
'use client';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


export function RaffleMetrics({ raffle }: { raffle: Raffle }) {
  const firestore = useFirestore();

  const paidTicketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'raffles', raffle.id, 'tickets'), where('status', '==', 'paid')) : null, [firestore, raffle.id]);
  const { data: paidTicketsData } = useCollection<TicketType>(paidTicketsQuery);
  const paidTickets = paidTicketsData?.length || 0;
  
  const reservedTicketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'raffles', raffle.id, 'tickets'), where('status', '==', 'reserved')) : null, [firestore, raffle.id]);
  const { data: reservedTicketsData } = useCollection<TicketType>(reservedTicketsQuery);
  const reservedTickets = reservedTicketsData?.length || 0;

  const availableTickets = useMemo(() => raffle.ticketCount - paidTickets - reservedTickets, [raffle.ticketCount, paidTickets, reservedTickets]);
  
  const soldTickets = paidTickets + reservedTickets;
  const totalRevenue = paidTickets * raffle.price;
  const potentialRevenue = raffle.ticketCount * raffle.price;
  const salesProgress = soldTickets > 0 ? (soldTickets / raffle.ticketCount) * 100 : 0;

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
                    <span className="text-muted-foreground text-sm">{soldTickets} de {raffle.ticketCount} boletos vendidos</span>
                    <span className="font-bold text-lg">{salesProgress.toFixed(0)}%</span>
                </div>
                <Progress value={salesProgress} />
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
                <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
