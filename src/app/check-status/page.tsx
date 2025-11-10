
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRaffles } from '@/lib/data';
import type { Ticket, Raffle } from '@/lib/definitions';
import { Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketStatusDisplay, TicketStatus } from '@/components/ticket-status-display';


export default function CheckStatusPage() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedRaffleId, setSelectedRaffleId] = useState('');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [searchResult, setSearchResult] = useState<TicketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // getRaffles is synchronous in this mock, but in a real app it would be async
    setRaffles(getRaffles());
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSearchResult(null);

    const raffle = raffles.find(r => r.id === selectedRaffleId);
    let foundTicket: Ticket | undefined;
    
    if (raffle) {
        foundTicket = raffle.tickets.find(t => t.number === parseInt(ticketNumber, 10));
    }
    
    setTimeout(() => {
      if (foundTicket && raffle) {
        setSearchResult({
          status: foundTicket.status,
          ticket: foundTicket,
          raffle: raffle,
        });
      } else {
        const raffleForAvailableCheck = raffles.find(r => r.id === selectedRaffleId);
        const ticketIsReal = raffleForAvailableCheck?.tickets.some(t => t.number === parseInt(ticketNumber, 10));
        
        if (ticketIsReal && raffleForAvailableCheck) {
            const ticket = raffleForAvailableCheck.tickets.find(t => t.number === parseInt(ticketNumber, 10))!;
             setSearchResult({ status: 'available', ticket: ticket, raffle: raffleForAvailableCheck });
        } else {
            setSearchResult({ status: 'not-found' });
        }
      }
      setIsLoading(false);
    }, 500); 
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-6">
                <TicketIcon className="h-8 w-8 text-primary" />
            </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Consulta el Estado de tu Boleto</h1>
        </div>

        <form onSubmit={handleSearch} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="raffle">Selecciona la Rifa</Label>
            <Select onValueChange={setSelectedRaffleId} value={selectedRaffleId} required>
                <SelectTrigger id="raffle">
                    <SelectValue placeholder="Elige una rifa..." />
                </SelectTrigger>
                <SelectContent>
                    {raffles.map(raffle => (
                        <SelectItem key={raffle.id} value={raffle.id}>
                            {raffle.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticketNumber">Ingresa tu número de boleto</Label>
            <Input
              id="ticketNumber"
              type="number"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Ej: 0123"
              required
              disabled={!selectedRaffleId}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading || !selectedRaffleId || !ticketNumber}>
            {isLoading ? 'Consultando...' : 'Consultar Estado'}
          </Button>
        </form>

        {searchResult && <TicketStatusDisplay result={searchResult} />}

        <div className="text-center mt-8">
            <Link href="/#faq" className="text-sm text-muted-foreground underline">
                ¿Tienes dudas? Lee nuestras Preguntas Frecuentes
            </Link>
        </div>
      </div>
    </div>
  );
}
