'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Raffle, Ticket } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Ticket as TicketIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';


type RaffleCardProps = {
  raffle: Raffle;
};

export function RaffleCard({ raffle }: RaffleCardProps) {
  const t = useTranslations('Index');
  const [soldTicketsCount, setSoldTicketsCount] = useState(0);

  useEffect(() => {
    async function loadTickets() {
        const tickets = await getTicketsByRaffleId(raffle.id);
        setSoldTicketsCount(tickets.filter(t => t.status !== 'available').length);
    }
    loadTickets();
  }, [raffle.id]);
  
  const progress = soldTicketsCount > 0 ? (soldTicketsCount / raffle.ticketCount) * 100 : 0;
  
  // Determinar la URL de la imagen, usando un marcador de posición si no hay imágenes
  const imageUrl = raffle.images.length > 0 ? raffle.images[0] : 'https://placehold.co/600x400';
  const placeholder = PlaceHolderImages.find(p => p.imageUrls[0] === raffle.images[0]);

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800/80">
        <Link href={`/raffles/${raffle.id}`} className="block">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={imageUrl} // Usar la URL de imagen resuelta
              alt={raffle.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={placeholder?.imageHint || 'placeholder image'}
            />
          </div>
        </Link>
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-headline text-lg font-semibold mb-2 flex-grow">
          <Link href={`/raffles/${raffle.id}`} className="hover:text-primary">{raffle.name}</Link>
        </h3>
        
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div>
            <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-primary">{formatCurrency(raffle.price)}</span>
                <div className="flex items-center gap-1">
                    <TicketIcon className="h-4 w-4" />
                    <span>{soldTicketsCount} / {raffle.ticketCount}</span>
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href={`/raffles/${raffle.id}`}>{t('buyTickets')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}