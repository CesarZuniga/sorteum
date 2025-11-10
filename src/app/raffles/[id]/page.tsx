'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { updateTicketStatus } from '@/lib/data';
import type { Ticket, Raffle } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign, Ticket as TicketIcon, Shuffle, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

const TicketItem = ({ ticket, onSelect, isSelected, isSuggested }: { ticket: Ticket, onSelect: (ticket: Ticket) => void, isSelected: boolean, isSuggested: boolean }) => {
  const getStatusClasses = () => {
    switch (ticket.status) {
      case 'paid':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-500 text-white cursor-not-allowed';
      case 'available':
        if (isSelected) return 'bg-primary text-primary-foreground';
        if (isSuggested) return 'bg-blue-300 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600';
        return 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <button
      disabled={ticket.status !== 'available'}
      onClick={() => onSelect(ticket)}
      className={`flex items-center justify-center p-2 rounded-md font-semibold transition-colors duration-200 ${getStatusClasses()}`}
      aria-label={`Ticket number ${ticket.number}, status ${ticket.status}${isSelected ? ', selected' : ''}${isSuggested ? ', suggested' : ''}`}
    >
      {String(ticket.number).padStart(3, '0')}
    </button>
  );
};

export default function RaffleDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const raffleRef = useMemoFirebase(() => doc(firestore, 'raffles', params.id), [firestore, params.id]);
  const ticketsRef = useMemoFirebase(() => collection(firestore, 'raffles', params.id, 'tickets'), [firestore, params.id]);

  const { data: raffleState, isLoading: isRaffleLoading } = useDoc<Raffle>(raffleRef);
  const { data: tickets, isLoading: areTicketsLoading } = useCollection<Ticket>(ticketsRef);

  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [suggestedTickets, setSuggestedTickets] = useState<Ticket[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
  const [randomCount, setRandomCount] = useState<number>(1);
  const { toast } = useToast();

   if (isRaffleLoading) {
    return <div>Loading raffle...</div>
   }

  if (!raffleState) {
    notFound();
  }

  const handleSelectTicket = (ticket: Ticket) => {
    if (suggestedTickets.find(st => st.id === ticket.id)) {
        setSuggestedTickets(prev => prev.filter(st => st.id !== ticket.id));
    }

    setSelectedTickets((prev) =>
      prev.find((t) => t.id === ticket.id)
        ? prev.filter((t) => t.id !== ticket.id)
        : [...prev, ticket]
    );
  };

  const handleRandomSelect = () => {
    if (!tickets) return;
    const availableTickets = tickets.filter(
      (t) => t.status === 'available' && !selectedTickets.find(st => st.id === t.id)
    );

    if (randomCount > availableTickets.length) {
      toast({
        title: 'Boletos insuficientes',
        description: `Solo hay ${availableTickets.length} boletos disponibles para seleccionar.`,
        variant: 'destructive',
      });
      setSuggestedTickets([]);
      return;
    }

    const shuffled = availableTickets.sort(() => 0.5 - Math.random());
    const randomSelection = shuffled.slice(0, randomCount);
    setSuggestedTickets(randomSelection);
  };
  
  const acceptSuggestion = () => {
    setSelectedTickets(prev => {
        const newTickets = suggestedTickets.filter(st => !prev.find(pt => pt.id === st.id));
        return [...prev, ...newTickets];
    });
    setSuggestedTickets([]);
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTickets.length === 0) {
      toast({ title: 'No tickets selected', description: 'Please select one or more tickets.', variant: 'destructive' });
      return;
    }
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone) {
      toast({ title: 'Missing information', description: 'Please fill out all your details.', variant: 'destructive' });
      return;
    }

    const promises = selectedTickets.map(ticket => {
        return updateTicketStatus(raffleState.id, ticket.number, 'reserved', buyerInfo);
    });

    await Promise.all(promises);

    setSelectedTickets([]);
    setBuyerInfo({ name: '', email: '', phone: '' });

    toast({
      title: '¡Boletos Reservados!',
      description: `Tus boletos han sido reservados por 15 minutos. Total: ${formatCurrency(totalPrice)}`,
      action: (<div className="flex items-center"><Clock className="mr-2"/> Completa tu pago.</div>)
    });
  };

  const totalPrice = selectedTickets.length * raffleState.price;
  const placeholder = PlaceHolderImages.find(p => p.imageUrl === raffleState.image);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-[3/2] w-full relative mb-4 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={raffleState.image}
              alt={raffleState.name}
              fill
              className="object-cover"
              data-ai-hint={placeholder?.imageHint}
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline mb-2">{raffleState.name}</h1>
          <p className="text-lg text-muted-foreground mb-6">{raffleState.description}</p>
          <div className="flex flex-wrap gap-4 text-lg">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <DollarSign className="h-5 w-5" />
              <span>{formatCurrency(raffleState.price)} per ticket</span>
            </div>
            <div className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              <span>{raffleState.ticketCount} tickets total</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Ends: {new Date(raffleState.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 font-headline">Select Your Tickets</h2>
              <div className="flex items-center gap-2 mb-4">
                  <Input 
                    type="number" 
                    min="1"
                    value={randomCount}
                    onChange={(e) => setRandomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24"
                    aria-label="Number of random tickets to select"
                  />
                  <Button variant="outline" onClick={handleRandomSelect}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Selección Rápida
                  </Button>
                  {suggestedTickets.length > 0 && (
                    <Button onClick={acceptSuggestion}>
                        <Check className="h-4 w-4 mr-2" />
                        Aceptar Sugerencia
                    </Button>
                  )}
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {areTicketsLoading && <p>Loading tickets...</p>}
                {tickets && tickets.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onSelect={handleSelectTicket}
                    isSelected={!!selectedTickets.find((t) => t.id === ticket.id)}
                    isSuggested={!!suggestedTickets.find((t) => t.id === ticket.id)}
                  />
                ))}
              </div>
               <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span>Available</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-300"></span>Suggested</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Reserved</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Paid</div>
              </div>
            </CardContent>
          </Card>

          {selectedTickets.length > 0 && (
            <Card>
              <CardContent className="p-6">
                 <h2 className="text-2xl font-bold mb-4 font-headline">Confirm Purchase</h2>
                <form onSubmit={handleReserve} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={buyerInfo.name} onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})} placeholder="John Doe" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" value={buyerInfo.phone} onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})} placeholder="555-555-5555" required />
                      </div>
                  </div>
                   <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={buyerInfo.email} onChange={e => setBuyerInfo({...buyerInfo, email: e.target.value})} placeholder="you@example.com" required />
                  </div>
                  <div className="text-xl font-bold">
                    Total: {formatCurrency(totalPrice)}
                  </div>
                  <Button type="submit" className="w-full" size="lg">Reservar Boletos</Button>
                   <p className="text-xs text-center text-muted-foreground pt-2">
                    Tienes 15 minutos para completar tu pago o los boletos serán liberados.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
