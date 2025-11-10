'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getRaffles } from '@/lib/data';
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';

export function DashboardMetrics() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);

  useEffect(() => {
    setRaffles(getRaffles());
  }, []);

  const totalRevenue = useMemo(() => {
    return raffles
      .flatMap(raffle => raffle.tickets)
      .filter(ticket => ticket.status === 'paid')
      .reduce((acc, ticket) => {
        const raffle = raffles.find(r => r.id === ticket.raffleId);
        return acc + (raffle?.price || 0);
      }, 0);
  }, [raffles]);

  const totalTicketsSold = useMemo(() => {
    return raffles.flatMap(r => r.tickets).filter(t => t.status === 'paid').length;
  }, [raffles]);
  
  const activeRaffles = useMemo(() => {
    return raffles.filter(r => r.active).length;
  }, [raffles]);

  const metrics = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign },
    { title: 'Active Raffles', value: activeRaffles, icon: Activity },
    { title: 'Tickets Sold (Paid)', value: totalTicketsSold, icon: Ticket },
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
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}