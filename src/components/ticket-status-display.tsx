'use client';

import type { Ticket, Raffle } from '@/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket as TicketIcon, CheckCircle2, AlertCircle, Hourglass, ShoppingCart, Trophy } from 'lucide-react';


export type TicketStatus = {
  status: 'paid' | 'reserved' | 'available' | 'not-found' | 'winner'; // Added 'winner' status
  ticket?: Ticket;
  raffle?: Raffle;
};

export function TicketStatusDisplay({ result }: { result: TicketStatus }) {
  if (result.status === 'not-found') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-4">
        <AlertCircle className="h-8 w-8" />
        <div>
          <h3 className="font-bold">Estado: Boleto no encontrado</h3>
          <p>Verifica el número de boleto y la rifa seleccionada e intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  if (result.status === 'available') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-4">
        <ShoppingCart className="h-8 w-8" />
        <div>
          <h3 className="font-bold">Estado: Boleto Disponible</h3>
          <p>Este boleto aún no ha sido comprado. ¡Puedes ser el afortunado!</p>
           <Button asChild variant="link" className="p-0 h-auto text-blue-700 dark:text-blue-300">
             <Link href={`/raffles/${result.raffle?.id}`}>Comprar este boleto</Link>
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
          <h3 className="font-bold">Estado: Pendiente de Pago</h3>
          {result.ticket?.buyerName ? <p>Boleto reservado por: <strong>{result.ticket.buyerName}</strong>.</p> : null}
          <p>Completa tu pago para participar en la rifa '{result.raffle?.name}'.</p>
        </div>
      </div>
    );
  }

  if (result.status === 'paid') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-4">
        <CheckCircle2 className="h-8 w-8" />
        <div>
          <h3 className="font-bold">Estado: Pagado</h3>
          {result.ticket?.buyerName ? <p>Comprado por: <strong>{result.ticket.buyerName}</strong>.</p> : null}
          <p>¡Mucha suerte en el sorteo de la rifa '{result.raffle?.name}'!</p>
        </div>
      </div>
    );
  }

  if (result.status === 'winner') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-4">
        <Trophy className="h-8 w-8" />
        <div>
          <h3 className="font-bold">Estado: ¡Ganador!</h3>
          {result.ticket?.buyerName ? <p>Comprado por: <strong>{result.ticket.buyerName}</strong>.</p> : null}
          <p>¡Felicidades! Tu boleto ha sido seleccionado como ganador en la rifa '{result.raffle?.name}'!</p>
        </div>
      </div>
    );
  }

  return null;
}