
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Raffle, Ticket } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { updateTicketStatus, getTicketsByRaffleId } from '@/lib/data';
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

interface TicketsTableProps {
    raffle: Raffle;
    maxWinners: number;
}

export function TicketsTable({ raffle, maxWinners }: TicketsTableProps) {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTickets = async () => {
    setIsLoading(true);
    const ticketsData = await getTicketsByRaffleId(raffle.id);
    setTickets(ticketsData.sort((a,b) => a.number - b.number));
    setIsLoading(false);
  }

  useEffect(() => {
    refreshTickets();
  }, [raffle.id]);

  const currentWinnerCount = tickets?.filter(t => t.isWinner).length || 0;
  const canMarkMoreWinners = currentWinnerCount < maxWinners;

  const handleUpdateStatus = async (ticketNumber: number, status: 'paid' | 'available' | 'winner') => {
    if (status === 'winner' && !canMarkMoreWinners) {
        toast({
            title: 'Winner Limit Reached',
            description: `You can only select ${maxWinners} winner(s) for this raffle.`,
            variant: 'destructive',
        });
        return;
    }
    
    const success = await updateTicketStatus(raffle.id, ticketNumber, status);
    if (success) {
        toast({ title: 'Ticket Updated', description: `Ticket #${ticketNumber} status changed to ${status}.` });
        await refreshTickets(); // Refresh data after update
    } else {
        toast({ title: 'Error', description: 'Could not update ticket status.', variant: 'destructive' });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Management</CardTitle>
        <CardDescription>View and confirm payments for all tickets. You can manually mark up to {maxWinners} winner(s). ({currentWinnerCount}/{maxWinners} selected).</CardDescription>
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
            {isLoading && <TableRow><TableCell colSpan={5}>Loading tickets...</TableCell></TableRow>}
            {tickets?.map((ticket) => {
              const { label, variant, icon: Icon } = statusConfig[ticket.status];
              return (
                <TableRow key={ticket.id} className={ticket.isWinner ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}>
                  <TableCell className="font-medium">{String(ticket.number).padStart(3, '0')}</TableCell>
                  <TableCell>
                     {ticket.isWinner ? (
                        <Badge variant="destructive" className="bg-yellow-500 text-yellow-950">
                          <Trophy className="mr-2 h-4 w-4" />
                          Winner
                        </Badge>
                      ) : (
                        <Badge variant={variant as any}>
                          <Icon className="mr-2 h-4 w-4" />
                          {label}
                        </Badge>
                     )}
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
                    {ticket.status === 'paid' && !ticket.isWinner && (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleUpdateStatus(ticket.number, 'winner')}
                            disabled={!canMarkMoreWinners}
                            title={!canMarkMoreWinners ? `Winner limit of ${maxWinners} reached.` : 'Mark as Winner'}
                        >
                            <Trophy className="mr-2 h-4 w-4" />
                            Mark as Winner
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
