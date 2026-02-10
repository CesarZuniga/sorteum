'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
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
import type { Raffle, Ticket as TicketType } from '@/lib/definitions';
import { deleteRaffleAction } from '@/lib/actions';
import { getRaffles, getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';


function RaffleRow({raffle, onDeleted}: {raffle: Raffle; onDeleted: () => void}) {
  const t = useTranslations('Admin');
  const [soldTicketsCount, setSoldTicketsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      const tickets = await getTicketsByRaffleId(raffle.id);
      const sold = tickets.filter(t => t.status !== 'available').length;
      setSoldTicketsCount(sold);
      setIsLoading(false);
    }
    loadTickets();
  }, [raffle.id]);

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('id', raffle.id);
    await deleteRaffleAction(formData);
    onDeleted();
  };

  return (
      <TableRow key={raffle.id}>
        <TableCell className="font-medium">
            <Link href={`/admin/raffles/${raffle.id}`} className="hover:underline">{raffle.name}</Link>
        </TableCell>
        <TableCell>
          {raffle.ticketsCreated < raffle.ticketCount ? (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              {t('processing')} ({Math.round((raffle.ticketsCreated / raffle.ticketCount) * 100)}%)
            </Badge>
          ) : (
            <Badge variant={raffle.active ? 'default' : 'secondary'}>
              {raffle.active ? t('active') : t('ended')}
            </Badge>
          )}
        </TableCell>
        <TableCell>{formatCurrency(raffle.price)}</TableCell>
        <TableCell>{isLoading ? t('loading') : soldTicketsCount} / {raffle.ticketCount}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t('actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href={`/admin/raffles/${raffle.id}`}>{t('view')}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/admin/raffles/${raffle.id}/edit`}>{t('edit')}</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">{t('delete')}</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteRaffleConfirmationTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.rich('deleteRaffleConfirmationDescription', {
                          raffleName: raffle.name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
  )
}

export default function RafflesPage() {
  const t = useTranslations('Admin');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getRaffles();
    setRaffles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t('rafflesTitle')}</h1>
          <p className="text-muted-foreground">{t('rafflesDescription')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/raffles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createRaffle')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('ticketsSoldColumn')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>{t('loading')}</TableCell></TableRow>}
              {raffles?.map((raffle) => (
                <RaffleRow key={raffle.id} raffle={raffle} onDeleted={loadData} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}