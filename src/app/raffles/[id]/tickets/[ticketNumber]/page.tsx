'use client';

import { useEffect, useState } from 'react';
import { TicketStatusDisplay, TicketStatus } from '@/components/ticket-status-display';
import { Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import type { Raffle, Ticket } from '@/lib/definitions';
import { getRaffleById, getTicketByNumber } from '@/lib/data';


export default function TicketStatusPage({ params }: { params: { id: string, ticketNumber: string } }) {
  const [result, setResult] = useState<TicketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const ticketNum = parseInt(params.ticketNumber, 10);
        
        const [raffle, ticket] = await Promise.all([
            getRaffleById(params.id),
            getTicketByNumber(params.id, ticketNum)
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
  }, [params.id, params.ticketNumber]);


  if (isLoading || !result) {
      return (
        <div className="container mx-auto px-4 py-12 flex justify-center">
            <div className="w-full max-w-md text-center">
                <p>Loading ticket status...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md">
         <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href={`/raffles/${params.id}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a la Rifa
            </Link>
        </Button>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-6">
            <TicketIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Estado del Boleto #{params.ticketNumber}</h1>
          <p className="text-muted-foreground mt-2">Rifa: {result?.raffle?.name || 'Desconocida'}</p>
        </div>

        <div className="mt-8">
            <TicketStatusDisplay result={result} />
        </div>
        
         <div className="text-center mt-8">
            <Link href="/check-status" className="text-sm text-muted-foreground underline">
                Consultar otro boleto
            </Link>
        </div>
      </div>
    </div>
  );
}