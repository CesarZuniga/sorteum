'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Raffle, Ticket } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { getRaffleById, updateTicketStatus as apiUpdateTicketStatus } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusConfig = {
  paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
  reserved: { label: 'Reserved', variant: 'secondary', icon: Clock },
  available: { label: 'Available', variant: 'outline', icon: XCircle },
};

export function TicketsTable({ initialRaffle }: { initialRaffle: Raffle }) {
  const [raffle, setRaffle] = useState(initialRaffle);
  const { toast } = useToast();

  const handleUpdateStatus = (ticketNumber: number, status: 'paid' | 'available') => {
    const success = apiUpdateTicketStatus(raffle.id, ticketNumber, status);
    if (success) {
      setRaffle(getRaffleById(raffle.id)!); // Re-fetch to update state
      toast({ title: 'Ticket Updated', description: `Ticket #${ticketNumber} status changed to ${status}.` });
    } else {
      toast({ title: 'Error', description: 'Could not update ticket status.', variant: 'destructive' });
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
                  <TableCell className="space-x-2">
                    {ticket.status === 'reserved' && (
                        <>
                        <Button size="sm" onClick={() => handleUpdateStatus(ticket.number, 'paid')}>
                            Confirm Payment
                        </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Liberar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will mark ticket #{ticket.number} as available and remove any buyer information. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus(ticket.number, 'available')}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </>
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
