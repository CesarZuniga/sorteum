'use client';

import { useState } from 'react';
import type { Raffle, Ticket } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatus } from '@/lib/data'; // Import updateTicketStatus

interface WinnerDrawingProps {
    raffle: Raffle;
    winnerCount: number;
    setWinnerCount: (count: number) => void;
    tickets: Ticket[]; // All tickets for the raffle
    refreshTickets: () => void; // Function to refresh tickets in parent
}

export function WinnerDrawing({ raffle, winnerCount, setWinnerCount, tickets, refreshTickets }: WinnerDrawingProps) {
  const { toast } = useToast();
  const [drawnWinners, setDrawnWinners] = useState<Ticket[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleWinnerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (!isNaN(count) && count >= 1) {
        setWinnerCount(count);
    } else if (e.target.value === '') {
        setWinnerCount(0); // Allow clearing the input
    }
  };

  const handleDrawWinners = async () => {
    setIsDrawing(true);
    setDrawnWinners([]); // Clear previous winners

    const paidTickets = tickets.filter(t => t.status === 'paid' && !t.isWinner);

    if (paidTickets.length === 0) {
      toast({
        title: 'No hay boletos pagados',
        description: 'No hay boletos pagados disponibles para el sorteo.',
        variant: 'destructive',
      });
      setIsDrawing(false);
      return;
    }

    if (winnerCount === 0) {
        toast({
            title: 'Número de ganadores no válido',
            description: 'Por favor, introduce un número de ganadores mayor que cero.',
            variant: 'destructive',
        });
        setIsDrawing(false);
        return;
    }

    if (winnerCount > paidTickets.length) {
      toast({
        title: 'Boletos insuficientes',
        description: `Solo hay ${paidTickets.length} boletos pagados disponibles. No se pueden sortear ${winnerCount} ganadores.`,
        variant: 'destructive',
      });
      setIsDrawing(false);
      return;
    }

    // Shuffle and select winners
    const shuffledTickets = [...paidTickets].sort(() => 0.5 - Math.random());
    const selectedWinners = shuffledTickets.slice(0, winnerCount);

    // Update status in DB for selected winners
    const updatePromises = selectedWinners.map(winner => 
      updateTicketStatus(raffle.id, winner.number, 'winner')
    );

    try {
      await Promise.all(updatePromises);
      setDrawnWinners(selectedWinners);
      toast({
        title: 'Sorteo Realizado',
        description: `Se han seleccionado ${winnerCount} ganadores.`,
      });
      refreshTickets(); // Refresh tickets in parent to update tables
    } catch (error) {
      console.error('Error drawing winners:', error);
      toast({
        title: 'Error en el sorteo',
        description: 'Hubo un problema al seleccionar los ganadores. Inténtalo de nuevo.',
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
            Realizar Sorteo Manual
          </CardTitle>
          <CardDescription>
            Configura el número de ganadores y realiza el sorteo de forma aleatoria entre los boletos pagados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="winnerCount">Número de Ganadores</Label>
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
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Ganadores Sorteados:</h3>
                    <ul className="list-disc pl-5">
                        {drawnWinners.map((winner, index) => (
                            <li key={winner.id}>
                                {index + 1}º Ganador: Boleto #{String(winner.number).padStart(3, '0')} ({winner.buyerName || 'N/A'})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDrawWinners} className="w-full" disabled={isDrawing}>
                {isDrawing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Realizando Sorteo...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Realizar Sorteo
                    </>
                )}
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}