'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Raffle, Ticket } from '@/lib/definitions';
import type { TicketStatusFilter } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getPaginatedTickets, getTicketStatusCounts, updateTicketStatus } from '@/lib/data';
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 50;

const statusConfig = {
  paid: { label: 'ticketTablePaid', variant: 'default', icon: CheckCircle },
  reserved: { label: 'ticketTableReserved', variant: 'secondary', icon: Clock },
  available: { label: 'ticketTableAvailable', variant: 'outline', icon: XCircle },
  winner: { label: 'ticketTableWinner', variant: 'destructive', icon: Trophy },
};

interface TicketsTableProps {
  raffle: Raffle;
  maxWinners: number;
  onTicketStatusChanged: () => void;
  refreshTrigger?: number;
}

export function TicketsTable({ raffle, maxWinners, onTicketStatusChanged, refreshTrigger }: TicketsTableProps) {
  const t = useTranslations('Admin');
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('all');
  const [winnerCount, setWinnerCount] = useState(0);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [result, counts] = await Promise.all([
        getPaginatedTickets(raffle.id, {
          page: currentPage,
          pageSize: PAGE_SIZE,
          statusFilter,
        }),
        getTicketStatusCounts(raffle.id),
      ]);
      setTickets(result.tickets);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setWinnerCount(counts.winner);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({ title: t('errorTitle'), description: t('drawingError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [raffle.id, currentPage, statusFilter, t, toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets, refreshTrigger]);

  // Guard: clamp page if it exceeds totalPages after a status change
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const canMarkMoreWinners = winnerCount < maxWinners;

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

    try {
      const success = await updateTicketStatus(raffle.id, ticketNumber, status);
      if (success) {
        toast({
          title: t('ticketTableTicketUpdated'),
          description: t.rich('ticketTableTicketUpdatedDescription', {
            ticketNumber: ticketNumber,
            status: status,
          })
        });
        await loadTickets();
        onTicketStatusChanged();
      }
    } catch {
      toast({ title: t('errorTitle'), description: t('drawingError'), variant: 'destructive' });
    }
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value as TicketStatusFilter);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ticketManagement')}</CardTitle>
        <CardDescription>
          {t.rich('ticketTableDescription', {
            maxWinners: maxWinners,
            currentWinners: winnerCount,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ticketTableFilterAll')}</SelectItem>
                <SelectItem value="available">{t('ticketTableAvailable')}</SelectItem>
                <SelectItem value="reserved">{t('ticketTableReserved')}</SelectItem>
                <SelectItem value="paid">{t('ticketTablePaid')}</SelectItem>
                <SelectItem value="winner">{t('ticketTableWinner')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            {t('ticketTableShowingCount', { count: totalCount })}
          </span>
        </div>

        {/* Table */}
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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>{t('ticketTableLoadingTickets')}</TableCell>
              </TableRow>
            )}
            {!isLoading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t('ticketTableNoTicketsFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && tickets.map((ticket) => {
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
                        title={String(!canMarkMoreWinners ? t.rich('ticketTableWinnerLimitReachedDescription', { maxWinners: maxWinners }) : t('ticketTableMarkAsWinner'))}
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

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {t('ticketTablePageInfo', {
              currentPage,
              totalPages,
            })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
