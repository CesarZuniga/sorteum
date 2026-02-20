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

  const imageUrl = raffle.images.length > 0 ? raffle.images[0] : 'https://placehold.co/600x400';
  const placeholder = PlaceHolderImages.find(p => p.imageUrls[0] === raffle.images[0]);

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl dark:bg-card">
        <Link href={`/raffles/${raffle.id}`} className="block overflow-hidden">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={imageUrl}
              alt={raffle.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={placeholder?.imageHint || 'placeholder image'}
            />
          </div>
        </Link>
      <CardContent className="p-4 flex-grow flex flex-col">
        <h3 className="font-headline text-lg font-semibold mb-2 flex-grow">
          <Link href={`/raffles/${raffle.id}`} className="hover:text-primary transition-colors">{raffle.name}</Link>
        </h3>

        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div>
            <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-base text-primary">{formatCurrency(raffle.price)}</span>
                <div className="flex items-center gap-1">
                    <TicketIcon className="h-4 w-4" />
                    <span>{soldTicketsCount} / {raffle.ticketCount}</span>
                </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-gradient-to-r from-primary to-orange-400 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <Button asChild className="w-full hover:shadow-glow-primary transition-shadow">
            <Link href={`/raffles/${raffle.id}`}>{t('buyTickets')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
