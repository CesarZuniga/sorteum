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
import { useTranslations } from 'next-intl';


const statusConfig = {
  paid: { label: 'Admin.ticketTablePaid', variant: 'default', icon: CheckCircle },
  reserved: { label: 'Admin.ticketTableReserved', variant: 'secondary', icon: Clock },
  available: { label: 'Admin.ticketTableAvailable', variant: 'outline', icon: XCircle },
  winner: { label: 'Admin.ticketTableWinner', variant: 'destructive', icon: Trophy }, // Added winner status
};

interface TicketsTableProps {
    raffle: Raffle;
    maxWinners: number;
    refreshTickets: () => void; // Add refreshTickets prop
}

export function TicketsTable({ raffle, maxWinners, refreshTickets }: TicketsTableProps) {
  const t = useTranslations('Admin');
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async () => {
    setIsLoading(true);
    const ticketsData = await getTicketsByRaffleId(raffle.id);
    setTickets(ticketsData.sort((a,b) => a.number - b.number));
    setIsLoading(false);
  }

  useEffect(() => {
    loadTickets();
  }, [raffle.id, refreshTickets]); // Depend on refreshTickets to re-load when parent triggers

  const currentWinnerCount = tickets?.filter(t => t.isWinner).length || 0;
  const canMarkMoreWinners = currentWinnerCount < maxWinners;

  const handleUpdateStatus = async (ticketNumber: number, status: 'paid' | 'available' | 'winner') => {
    if (status === 'winner' && !canMarkMoreWinners && !tickets.find(t => t.number === ticketNumber && t.isWinner)) {
        toast({
            title: t('ticketTableWinnerLimitReachedTitle'),
            description: t.rich('ticketTableWinnerLimitReachedDescription', {
              maxWinners: maxWinners,
            }),
            variant: 'destructive',
        });
        return;
    }
    
    const success = await updateTicketStatus(raffle.id, ticketNumber, status);
    if (success) {
        toast({ 
          title: t('ticketTableTicketUpdated'), 
          description: t.rich('ticketTableTicketUpdatedDescription', {
            ticketNumber: ticketNumber,
            status: status,
          })
        });
        refreshTickets(); // Call the parent's refresh function
    } else {
        toast({ title: t('errorTitle'), description: t('drawingError'), variant: 'destructive' });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ticketManagement')}</CardTitle>
        <CardDescription>
          {t.rich('ticketTableDescription', {
            maxWinners: maxWinners,
            currentWinners: currentWinnerCount,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('ticketTableTicketHash')}</TableHead>
              <TableHead>{t('ticketTableStatus')}</TableHead>
              <TableHead>{t('ticketTableBuyerName')}</TableHead>
              <TableHead>{t('ticketTableBuyerPhone')}</TableHead>
              <TableHead>{t('ticketTableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>{t('ticketTableLoadingTickets')}</TableCell></TableRow>}
            {tickets?.map((ticket) => {
              const { label, variant, icon: Icon } = statusConfig[ticket.status];
              return (
                <TableRow key={ticket.id} className={ticket.isWinner ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}>
                  <TableCell className="font-medium">{String(ticket.number).padStart(3, '0')}</TableCell>
                  <TableCell>
                     {ticket.isWinner ? (
                        <Badge variant="destructive" className="bg-yellow-500 text-yellow-950">
                          <Trophy className="mr-2 h-4 w-4" />
                          {t('ticketTableWinner')}
                        </Badge>
                      ) : (
                        <Badge variant={variant as any}>
                          <Icon className="mr-2 h-4 w-4" />
                          {t(label)}
                        </Badge>
                     )}
                  </TableCell>
                  <TableCell>{ticket.buyerName || 'N/A'}</TableCell>
                  <TableCell>{ticket.buyerPhone || 'N/A'}</TableCell>
                  <TableCell className="space-x-2">
                    {ticket.status === 'reserved' && (
                        <>
                        <Button size="sm" onClick={() => handleUpdateStatus(ticket.number, 'paid')}>
                            {t('ticketTableConfirmPayment')}
                        </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('ticketTableRelease')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('ticketTableReleaseConfirmationTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.rich('ticketTableReleaseConfirmationDescription', {
                                ticketNumber: ticket.number,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus(ticket.number, 'available')}>
                              {t('continue')}
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
                            title={!canMarkMoreWinners ? t.rich('ticketTableWinnerLimitReachedDescription', { maxWinners: maxWinners }) : t('ticketTableMarkAsWinner')}
                        >
                            <Trophy className="mr-2 h-4 w-4" />
                            {t('ticketTableMarkAsWinner')}
                        </Button>
                    )}
                    {ticket.isWinner && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('ticketTableRemoveWinner')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('ticketTableRemoveWinnerConfirmationTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.rich('ticketTableRemoveWinnerConfirmationDescription', {
                                ticketNumber: ticket.number,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus(ticket.number, 'paid')}>
                              {t('continue')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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