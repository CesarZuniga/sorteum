'use client';

import { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import type { Raffle } from '@/lib/definitions';
import { TicketsTable } from '@/components/admin/tickets-table';
import { WinnerDrawing } from '@/components/admin/winner-drawing';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RaffleMetrics } from '@/components/admin/raffle-metrics';
import { getRaffleById, getTicketsByRaffleId } from '@/lib/data'; // Import getTicketsByRaffleId

export default function SingleRaffleAdminPage({ params }: { params: { id: string } }) {
  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  const [winnerCount, setWinnerCount] = useState(1);
  const [tickets, setTickets] = useState<any[]>([]); // State to hold tickets

  const loadRaffleAndTickets = useCallback(async () => {
    const raffleData = await getRaffleById(params.id);
    setRaffle(raffleData);
    if (raffleData) {
      const ticketsData = await getTicketsByRaffleId(raffleData.id);
      setTickets(ticketsData);
    }
  }, [params.id]);

  useEffect(() => {
    loadRaffleAndTickets();
  }, [loadRaffleAndTickets]);

  const refreshTickets = useCallback(() => {
    loadRaffleAndTickets();
  }, [loadRaffleAndTickets]);


  if (raffle === undefined) {
    return <div>Loading...</div>;
  }

  if (!raffle) {
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
            <TicketsTable raffle={raffle} maxWinners={winnerCount} refreshTickets={refreshTickets} />
        </TabsContent>
        <TabsContent value="draw">
            <WinnerDrawing raffle={raffle} winnerCount={winnerCount} setWinnerCount={setWinnerCount} tickets={tickets} refreshTickets={refreshTickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}