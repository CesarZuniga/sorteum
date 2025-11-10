'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Raffle, Ticket } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { getRaffleById, updateTicketStatus as apiUpdateTicketStatus } from '@/lib/data';

const statusConfig = {
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
  reserved: { label: 'Reserved', variant: 'secondary', icon: Clock },
  available: { label: 'Available', variant: 'outline', icon: XCircle },
};

export function TicketsTable({ initialRaffle }: { initialRaffle: Raffle }) {
  const [raffle, setRaffle] = useState(initialRaffle);
  const { toast } = useToast();

  const confirmPayment = (ticketNumber: number) => {
    const success = apiUpdateTicketStatus(raffle.id, ticketNumber, 'paid');
    if (success) {
      setRaffle(getRaffleById(raffle.id)!); // Re-fetch to update state
      toast({ title: 'Payment Confirmed', description: `Ticket #${ticketNumber} is now marked as paid.` });
    } else {
      toast({ title: 'Error', description: 'Could not confirm payment.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Management</CardTitle>
        <CardDescription>View and confirm payments for all tickets in this raffle.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Buyer Name</TableHead>
              <TableHead>Buyer Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {raffle.tickets.map((ticket) => {
              const { label, variant, icon: Icon } = statusConfig[ticket.status];
              return (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{String(ticket.number).padStart(3, '0')}</TableCell>
                  <TableCell>
                    <Badge variant={variant as any}>
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.buyerName || 'N/A'}</TableCell>
                  <TableCell>{ticket.buyerPhone || 'N/A'}</TableCell>
                  <TableCell>
                    {ticket.status === 'reserved' && (
                      <Button size="sm" onClick={() => confirmPayment(ticket.number)}>
                        Confirm Payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
