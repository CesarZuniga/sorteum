import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Raffle } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Ticket } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type RaffleCardProps = {
  raffle: Raffle;
};

export function RaffleCard({ raffle }: RaffleCardProps) {
  const soldTickets = raffle.tickets.filter(t => t.status !== 'available').length;
  const progress = (soldTickets / raffle.ticketCount) * 100;
  const placeholder = PlaceHolderImages.find(p => p.imageUrl === raffle.image);

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={`/raffles/${raffle.id}`}>
          <div className="aspect-[3/2] w-full relative">
            <Image
              src={raffle.image}
              alt={raffle.name}
              fill
              className="object-cover"
              data-ai-hint={placeholder?.imageHint}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="font-headline text-xl mb-2">
          <Link href={`/raffles/${raffle.id}`} className="hover:text-primary">{raffle.name}</Link>
        </CardTitle>
        <CardDescription className="line-clamp-3">{raffle.description}</CardDescription>
        
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span>{soldTickets} / {raffle.ticketCount} tickets sold</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
           <div className="flex items-center gap-2 pt-2">
            <Calendar className="h-4 w-4" />
            <span>Ends: {new Date(raffle.deadline).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
        <p className="text-2xl font-bold text-primary">{formatCurrency(raffle.price)}</p>
        <Button asChild>
          <Link href={`/raffles/${raffle.id}`}>Buy Tickets</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
