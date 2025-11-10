'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { getRaffleById } from '@/lib/data';
import type { Raffle, Ticket } from '@/lib/definitions';
import { TicketsTable } from '@/components/admin/tickets-table';
import { WinnerDrawing } from '@/components/admin/winner-drawing';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaffleMetrics } from '@/components/admin/raffle-metrics';

export default function SingleRaffleAdminPage({ params }: { params: { id: string } }) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [winnerCount, setWinnerCount] = useState(1);

  useEffect(() => {
    const raffleData = getRaffleById(params.id);
    if (raffleData) {
      setRaffle(raffleData);
    }
  }, [params.id]);

  if (!raffle) {
    if (raffle === null) return <div>Loading...</div>;
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/admin/raffles">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Raffles
            </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{raffle.name}</h1>
        <p className="text-muted-foreground">{raffle.description}</p>
      </div>

      <RaffleMetrics raffle={raffle} />

      <Tabs defaultValue="tickets">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
            <TabsTrigger value="draw">Draw Winners</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
            <TicketsTable raffle={raffle} setRaffle={setRaffle} maxWinners={winnerCount} />
        </TabsContent>
        <TabsContent value="draw">
            <WinnerDrawing raffle={raffle} winnerCount={winnerCount} setWinnerCount={setWinnerCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}