'use client';
import { TicketStatusDisplay, TicketStatus } from '@/components/ticket-status-display';
import { Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Raffle, Ticket } from '@/lib/definitions';
import { useEffect, useState } from 'react';

export default function TicketStatusPage({ params }: { params: { id: string, ticketNumber: string } }) {
  const firestore = useFirestore();
  const [result, setResult] = useState<TicketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  const raffleRef = useMemoFirebase(() => doc(firestore, 'raffles', params.id), [firestore, params.id]);
  const { data: raffle, isLoading: isRaffleLoading } = useDoc<Raffle>(raffleRef);

  useEffect(() => {
    const fetchTicket = async () => {
        if (raffle && !isRaffleLoading) {
            const ticketNum = parseInt(params.ticketNumber, 10);
            if(isNaN(ticketNum)) {
                setResult({ status: 'not-found' });
                setLoading(false);
                return;
            }

            const ticketsQuery = query(collection(firestore, `raffles/${params.id}/tickets`), where('number', '==', ticketNum));
            const ticketSnapshot = await getDocs(ticketsQuery);
            
            if (ticketSnapshot.empty) {
                 setResult({ status: 'not-found' });
            } else {
                const ticketDoc = ticketSnapshot.docs[0];
                const ticket = ticketDoc.data() as Ticket;
                setResult({ status: ticket.status, ticket, raffle });
            }
            setLoading(false);
        } else if (!isRaffleLoading) {
             setResult({ status: 'not-found' });
             setLoading(false);
        }
    }
    fetchTicket();
  }, [raffle, isRaffleLoading, params.id, params.ticketNumber, firestore]);
  

  if (loading || isRaffleLoading) {
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
            {result && <TicketStatusDisplay result={result} />}
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
