'use client';

import { useState } from 'react';
import type { Raffle, Ticket } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTicketStatusCounts, drawWinnersServerSide } from '@/lib/data';
import { useTranslations } from 'next-intl';

interface WinnerDrawingProps {
    raffle: Raffle;
    winnerCount: number;
    setWinnerCount: (count: number) => void;
    onWinnersDrawn: () => void;
}

export function WinnerDrawing({ raffle, winnerCount, setWinnerCount, onWinnersDrawn }: WinnerDrawingProps) {
  const t = useTranslations('Admin');
  const { toast } = useToast();
  const [drawnWinners, setDrawnWinners] = useState<Ticket[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleWinnerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (!isNaN(count) && count >= 1) {
        setWinnerCount(count);
    } else if (e.target.value === '') {
        setWinnerCount(0);
    }
  };

  const handleDrawWinners = async () => {
    setIsDrawing(true);
    setDrawnWinners([]);

    try {
      const counts = await getTicketStatusCounts(raffle.id);
      const eligibleCount = counts.paid;

      if (eligibleCount === 0) {
        toast({
          title: t('errorTitle'),
          description: t('noPaidTickets'),
          variant: 'destructive',
        });
        return;
      }

      if (winnerCount === 0) {
        toast({
          title: t('errorTitle'),
          description: t('invalidWinnerCount'),
          variant: 'destructive',
        });
        return;
      }

      if (winnerCount > eligibleCount) {
        toast({
          title: t('errorTitle'),
          description: t.rich('insufficientPaidTickets', {
            paidTicketsCount: eligibleCount,
            winnerCount: winnerCount,
          }),
          variant: 'destructive',
        });
        return;
      }

      const winners = await drawWinnersServerSide(raffle.id, winnerCount);
      setDrawnWinners(winners);
      toast({
        title: t('drawingSuccess', { winnerCount: winnerCount }),
        description: `Se han seleccionado ${winnerCount} ganadores.`,
      });
      onWinnersDrawn();

    } catch (error) {
      console.error('Error drawing winners:', error);
      toast({
        title: t('errorTitle'),
        description: t('drawingError'),
        variant: 'destructive',
      });
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-primary" />
            {t('drawWinnersManualTitle')}
          </CardTitle>
          <CardDescription>
            {t('drawWinnersManualDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="winnerCount">{t('numberOfWinners')}</Label>
              <Input
                id="winnerCount"
                name="winnerCount"
                type="number"
                min="1"
                value={winnerCount}
                onChange={handleWinnerCountChange}
                required
                disabled={isDrawing}
              />
            </div>
            {drawnWinners.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">{t('drawnWinners')}</h3>
                    <div className="space-y-2">
                        {drawnWinners.map((winner, index) => (
                            <div key={winner.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-400 text-yellow-900 font-bold text-sm flex-shrink-0">
                                    {String(winner.number).padStart(3, '0')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{winner.buyerName || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t.rich('winnerNumber', {
                                          index: index + 1,
                                          ticketNumber: String(winner.number).padStart(3, '0'),
                                          buyerName: winner.buyerName || 'N/A',
                                        })}
                                    </p>
                                </div>
                                <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDrawWinners} className="w-full" disabled={isDrawing}>
                {isDrawing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('drawingWinners')}
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('drawWinnersButton')}
                    </>
                )}
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
