'use client';

import type { Ticket, Raffle } from '@/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket as TicketIcon, CheckCircle2, AlertCircle, Hourglass, ShoppingCart, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';


export type TicketStatus = {
  status: 'paid' | 'reserved' | 'available' | 'not-found' | 'winner';
  ticket?: Ticket;
  raffle?: Raffle;
};

export function TicketStatusDisplay({ result }: { result: TicketStatus }) {
  const t = useTranslations('TicketStatusDisplay');

  const richTags = {
    b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  };

  if (result.status === 'not-found') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-4">
        <AlertCircle className="h-8 w-8" />
        <div>
          <h3 className="font-bold">{t('ticketNotFoundStatus')}</h3>
          <p>{t('ticketNotFoundDescription')}</p>
        </div>
      </div>
    );
  }

  if (result.status === 'available') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-4">
        <ShoppingCart className="h-8 w-8" />
        <div>
          <h3 className="font-bold">{t('availableStatus')}</h3>
          <p>{t('availableDescription')}</p>
           <Button asChild variant="link" className="p-0 h-auto text-blue-700 dark:text-blue-300">
             <Link href={`/raffles/${result.raffle?.id}`}>{t('buyThisTicket')}</Link>
           </Button>
        </div>
      </div>
    );
  }

  if (result.status === 'reserved') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-4">
        <Hourglass className="h-8 w-8" />
        <div>
          <h3 className="font-bold">{t('reservedStatus')}</h3>
          {result.ticket?.buyerName ? <p>{t.rich('reservedBy', { buyerName: result.ticket.buyerName, ...richTags })}</p> : null}
          <p>{t.rich('reservedDescription', { raffleName: result.raffle?.name || t('unknownRaffle') })}</p>
        </div>
      </div>
    );
  }

  if (result.status === 'paid') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-4">
        <CheckCircle2 className="h-8 w-8" />
        <div>
          <h3 className="font-bold">{t('paidStatus')}</h3>
          {result.ticket?.buyerName ? <p>{t.rich('purchasedBy', { buyerName: result.ticket.buyerName, ...richTags })}</p> : null}
          <p>{t.rich('paidDescription', { raffleName: result.raffle?.name || t('unknownRaffle') })}</p>
        </div>
      </div>
    );
  }

  if (result.status === 'winner') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-4">
        <Trophy className="h-8 w-8" />
        <div>
          <h3 className="font-bold">{t('winnerStatus')}</h3>
          {result.ticket?.buyerName ? <p>{t.rich('purchasedBy', { buyerName: result.ticket.buyerName, ...richTags })}</p> : null}
          <p>{t.rich('winnerDescription', { raffleName: result.raffle?.name || t('unknownRaffle') })}</p>
        </div>
      </div>
    );
  }

  return null;
}
