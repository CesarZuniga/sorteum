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
import { getRaffleById } from '@/lib/data';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function SingleRaffleAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Admin');
  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  const [winnerCount, setWinnerCount] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const resolvedParams = React.use(params);
  const raffleId = resolvedParams.id;

  const loadRaffle = useCallback(async () => {
    const raffleData = await getRaffleById(raffleId);
    setRaffle(raffleData);
  }, [raffleId]);

  useEffect(() => {
    loadRaffle();
  }, [loadRaffle]);

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (raffle === undefined) {
    return <div>{t('loading')}</div>;
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
                {t('backToRaffle')}
            </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{raffle.name}</h1>
        <p className="text-muted-foreground">{raffle.description}</p>
      </div>

      <RaffleMetrics raffle={raffle} refreshTrigger={refreshKey} />

      <Tabs defaultValue="tickets">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets">{t('ticketManagement')}</TabsTrigger>
            <TabsTrigger value="draw">{t('drawWinners')}</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
            <TicketsTable raffle={raffle} maxWinners={winnerCount} onTicketStatusChanged={handleDataChanged} refreshTrigger={refreshKey} />
        </TabsContent>
        <TabsContent value="draw">
            <WinnerDrawing raffle={raffle} winnerCount={winnerCount} setWinnerCount={setWinnerCount} onWinnersDrawn={handleDataChanged} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
