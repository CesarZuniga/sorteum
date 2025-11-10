import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Raffle } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Ticket } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type RaffleCardProps = {
  raffle: Raffle;
};

export function RaffleCard({ raffle }: RaffleCardProps) {
  const soldTickets = raffle.tickets.filter(t => t.status !== 'available').length;
  const progress = (soldTickets / raffle.ticketCount) * 100;
  const placeholder = PlaceHolderImages.find(p => p.imageUrl === raffle.image);

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800/80">
        <Link href={`/raffles/${raffle.id}`} className="block">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={raffle.image}
              alt={raffle.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={placeholder?.imageHint}
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
                    <Ticket className="h-4 w-4" />
                    <span>{soldTickets} / {raffle.ticketCount}</span>
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href={`/raffles/${raffle.id}`}>Comprar Boletos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
