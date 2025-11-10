'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getRaffleById, updateTicketStatus } from '@/lib/data';
import type { Ticket } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign, Ticket as TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const TicketItem = ({ ticket, onSelect, isSelected }: { ticket: Ticket, onSelect: (ticket: Ticket) => void, isSelected: boolean }) => {
  const getStatusClasses = () => {
    switch (ticket.status) {
      case 'paid':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-500 text-white cursor-not-allowed';
      case 'available':
        return isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <button
      disabled={ticket.status !== 'available'}
      onClick={() => onSelect(ticket)}
      className={`flex items-center justify-center p-2 rounded-md font-semibold transition-colors duration-200 ${getStatusClasses()}`}
      aria-label={`Ticket number ${ticket.number}, status ${ticket.status}${isSelected ? ', selected' : ''}`}
    >
      {String(ticket.number).padStart(3, '0')}
    </button>
  );
};

export default function RaffleDetailPage({ params }: { params: { id: string } }) {
  const raffle = getRaffleById(params.id);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
  const [raffleState, setRaffleState] = useState(raffle);
  const { toast } = useToast();

  if (!raffleState) {
    notFound();
  }

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTickets((prev) =>
      prev.find((t) => t.id === ticket.id)
        ? prev.filter((t) => t.id !== ticket.id)
        : [...prev, ticket]
    );
  };
  
  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTickets.length === 0) {
      toast({ title: 'No tickets selected', description: 'Please select one or more tickets.', variant: 'destructive' });
      return;
    }
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone) {
      toast({ title: 'Missing information', description: 'Please fill out all your details.', variant: 'destructive' });
      return;
    }

    selectedTickets.forEach(ticket => {
        updateTicketStatus(raffleState.id, ticket.number, 'reserved', buyerInfo);
    });

    setRaffleState(getRaffleById(params.id)!); // Re-fetch to update UI
    setSelectedTickets([]);
    setBuyerInfo({ name: '', email: '', phone: '' });

    toast({
      title: 'Tickets Reserved!',
      description: `Your tickets have been reserved. Please complete payment. Total: ${formatCurrency(totalPrice)}`,
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
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {raffleState.tickets.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onSelect={handleSelectTicket}
                    isSelected={!!selectedTickets.find((t) => t.id === ticket.id)}
                  />
                ))}
              </div>
               <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span>Available</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Reserved</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Paid</div>
              </div>
            </CardContent>
          </Card>

          {selectedTickets.length > 0 && (
            <Card>
              <CardContent className="p-6">
                 <h2 className="text-2xl font-bold mb-4 font-headline">Confirm Purchase</h2>
                <form onSubmit={handlePurchase} className="space-y-4">
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
                  <Button type="submit" className="w-full" size="lg">Reserve Tickets</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
