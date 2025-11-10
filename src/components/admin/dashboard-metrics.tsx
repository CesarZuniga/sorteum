import { getRaffles } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Ticket, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function DashboardMetrics() {
  const raffles = getRaffles();

  const activeRaffles = raffles.filter(r => r.active).length;
  
  const totalTicketsSold = raffles.reduce((acc, raffle) => {
    return acc + raffle.tickets.filter(t => t.status === 'paid').length;
  }, 0);
  
  const totalRevenue = raffles.reduce((acc, raffle) => {
    const paidTickets = raffle.tickets.filter(t => t.status === 'paid').length;
    return acc + (paidTickets * raffle.price);
  }, 0);

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
