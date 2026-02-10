'use client';

import React, { useEffect, useState } from 'react';
import { TicketStatusDisplay, TicketStatus } from '@/components/ticket-status-display';
import { Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import type { Raffle, Ticket } from '@/lib/definitions';
import { getRaffleById, getTicketByNumber } from '@/lib/data';
import { useTranslations } from 'next-intl';


export default function TicketStatusPage({ params }: { params: Promise<{ id: string, ticketNumber: string }> }) {
  const resolvedParams = React.use(params);
  const t = useTranslations('TicketStatusDisplay');
  const tIndex = useTranslations('Index');
  const [result, setResult] = useState<TicketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const ticketNum = parseInt(resolvedParams.ticketNumber, 10);

        const [raffle, ticket] = await Promise.all([
            getRaffleById(resolvedParams.id),
            getTicketByNumber(resolvedParams.id, ticketNum)
        ]);

        if (!raffle) {
             setResult({ status: 'not-found' });
        } else if (!ticket) {
            setResult({ status: 'not-found', raffle: raffle });
        } else {
            setResult({ status: ticket.status, ticket, raffle });
        }
        setIsLoading(false);
    }

    loadData();
  }, [resolvedParams.id, resolvedParams.ticketNumber]);


  if (isLoading || !result) {
      return (
        <div className="container mx-auto px-4 py-12 flex justify-center">
            <div className="w-full max-w-md text-center">
                <p>{tIndex('loading')}</p>
            </div>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md">
         <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href={`/raffles/${resolvedParams.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {tIndex('backToRaffle')}
            </Link>
        </Button>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-6">
            <TicketIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t('title')} #{resolvedParams.ticketNumber}</h1>
          <p className="text-muted-foreground mt-2">Rifa: {result?.raffle?.name || t('unknownRaffle')}</p>
        </div>

        <div className="mt-8">
            <TicketStatusDisplay result={result} />
        </div>
        
         <div className="text-center mt-8">
            <Link href="/check-status" className="text-sm text-muted-foreground underline">
                {t('checkAnotherTicket')}
            </Link>
        </div>
      </div>
    </div>
  );
}