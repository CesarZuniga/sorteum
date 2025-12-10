'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { updateTicketStatus, getRaffleById, getTicketsByRaffleId, getPaymentMethods } from '@/lib/data';
import type { Ticket, Raffle, PaymentMethod } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign, Ticket as TicketIcon, Shuffle, Check, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'; // Import Carousel components and CarouselApi
import { cn } from '@/lib/utils'; // Import cn for utility classes
import { PaymentMethodCard } from '@/components/payment-method-card'; // Import the new component

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

export default function RaffleDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const t = useTranslations('RaffleDetail');
  const tIndex = useTranslations('Index');
  const [resolvedRaffleId, setResolvedRaffleId] = useState<string | null>(null);

  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]); // New state for payment methods
  
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [suggestedTickets, setSuggestedTickets] = useState<Ticket[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
  const [randomCount, setRandomCount] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para el término de búsqueda
  const { toast } = useToast();

  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await Promise.resolve(params);
      setResolvedRaffleId(resolved.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (resolvedRaffleId) {
      async function loadData() {
          const [raffleData, ticketsData, paymentMethodsData] = await Promise.all([
              getRaffleById(resolvedRaffleId),
              getTicketsByRaffleId(resolvedRaffleId),
              getPaymentMethods() // Fetch payment methods
          ]);
          setRaffle(raffleData);
          setTickets(ticketsData.sort((a,b) => a.number - b.number));
          setPaymentMethods(paymentMethodsData); // Set payment methods
      }
      loadData();
    }
  }, [resolvedRaffleId]);

  // Carousel effect
  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);


  if (resolvedRaffleId === null || raffle === undefined || tickets === null) {
    return <div>{tIndex('loading')}</div>;
  }

  if (!raffle) {
    notFound();
  }
  
  const refreshTickets = async () => {
    if (resolvedRaffleId) {
      const ticketsData = await getTicketsByRaffleId(resolvedRaffleId);
      setTickets(ticketsData.sort((a,b) => a.number - b.number));
    }
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
        title: t('insufficientTicketsTitle'),
        description: t.rich('insufficientTicketsDescription', {
          availableCount: availableTickets.length,
        }),
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
      toast({ title: t('noTicketsSelectedTitle'), description: t('noTicketsSelectedDescription'), variant: 'destructive' });
      return;
    }
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone) {
      toast({ title: t('missingInfoTitle'), description: t('missingInfoDescription'), variant: 'destructive' });
      return;
    }

    const promises = selectedTickets.map(ticket => {
      return updateTicketStatus(resolvedRaffleId!, ticket.number, 'reserved', buyerInfo);
    });
    
    await Promise.all(promises);

    await refreshTickets();

    setSelectedTickets([]);
    setSuggestedTickets([]);
    setBuyerInfo({ name: '', email: '', phone: '' });

    toast({
      title: t('ticketsReservedTitle'),
      description: t.rich('ticketsReservedDescription', {
        totalPrice: formatCurrency(totalPrice),
      }),
      action: (<div className="flex items-center"><Clock className="mr-2"/> {t('completePayment')}</div>)
    });
  };

  const totalPrice = selectedTickets.length * raffle.price;
  const placeholder = PlaceHolderImages.find(p => p.imageUrls[0] === raffle.images[0]); // Use first image for placeholder hint

  // Filtrar boletos basados en el término de búsqueda
  const filteredTickets = tickets?.filter(ticket => 
    String(ticket.number).padStart(3, '0').includes(searchTerm)
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {tIndex('backToRaffle')}
        </Link>
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {raffle.images.length > 0 ? (
            <Carousel setApi={setApi} className="w-full max-w-full mb-4 rounded-lg overflow-hidden shadow-lg">
              <CarouselContent>
                {raffle.images.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-[3/2] w-full relative">
                      <Image
                        src={imageUrl}
                        alt={`${raffle.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint={placeholder?.imageHint || 'raffle image'}
                        priority={index === 0} // Prioritize loading the first image
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
              {count > 1 && ( // Only show dots if there's more than one image
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {Array.from({ length: count }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        "h-2 w-2 rounded-full bg-white/50 transition-all",
                        index + 1 === current ? "w-6 bg-white" : ""
                      )}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </Carousel>
          ) : (
            <div className="aspect-[3/2] w-full relative mb-4 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://placehold.co/600x400"
                alt="No image available"
                fill
                className="object-cover"
                data-ai-hint="placeholder image"
              />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline mb-2">{raffle.name}</h1>
          <p className="text-lg text-muted-foreground mb-6">{raffle.description}</p>
          <div className="flex flex-wrap gap-4 text-lg">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <DollarSign className="h-5 w-5" />
              <span>{formatCurrency(raffle.price)} {t('perTicket')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              <span>{raffle.ticketCount} {t('ticketsTotal')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{t('ends')} {format(new Date(raffle.deadline), 'PPP')}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 font-headline">{t('selectYourTickets')}</h2>
              
              {/* Campo de búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('enterTicketNumber')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  aria-label={t('searchTickets')}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
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
                    {t('quickSelect')}
                  </Button>
                  {suggestedTickets.length > 0 && (
                    <Button onClick={acceptSuggestion}>
                        <Check className="h-4 w-4 mr-2" />
                        {t('acceptSuggestion')}
                    </Button>
                  )}
              </div>

              {/* Nueva etiqueta para mostrar los boletos sugeridos */}
              {suggestedTickets.length > 0 && (
                 <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                   <strong>{t('suggestedTicketsLabel')}:</strong> {suggestedTickets.map(t => String(t.number).padStart(3, '0')).join(', ')}
                 </p>
              )}

              {/* Sección de boletos con scroll */}
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {filteredTickets.map((ticket) => (
                    <TicketItem
                      key={ticket.id}
                      ticket={ticket}
                      onSelect={handleSelectTicket}
                      isSelected={!!selectedTickets.find((t) => t.id === ticket.id)}
                      isSuggested={!!suggestedTickets.find((t) => t.id === ticket.id)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>

               <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span>{t('available')}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-300"></span>{t('suggested')}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>{t('reserved')}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>{t('paid')}</div>
              </div>
            </CardContent>
          </Card>

          {selectedTickets.length > 0 && (
            <Card>
              <CardContent className="p-6">
                 <h2 className="text-2xl font-bold mb-4 font-headline">{t('confirmPurchase')}</h2>
                 {/* Etiqueta para mostrar los boletos seleccionados */}
                 <p className="text-sm text-muted-foreground mb-4">
                   <strong>{t('selectedTicketsLabel')}:</strong> {selectedTickets.map(t => String(t.number).padStart(3, '0')).join(', ')}
                 </p>
                <form onSubmit={handleReserve} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="name">{t('fullName')}</Label>
                        <Input id="name" value={buyerInfo.name} onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})} placeholder="John Doe" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t('phoneNumber')}</Label>
                        <Input id="phone" type="tel" value={buyerInfo.phone} onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})} placeholder="555-555-5555" required />
                      </div>
                  </div>
                   <div>
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" type="email" value={buyerInfo.email} onChange={e => setBuyerInfo({...buyerInfo, email: e.target.value})} placeholder="you@example.com" required />
                  </div>
                  <div className="text-xl font-bold">
                    {t('total')} {formatCurrency(totalPrice)}
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    {t('reserveTickets')}
                  </Button>
                   <p className="text-xs text-center text-muted-foreground pt-2">
                    {t('reservationNotice')}
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

          {/* New section for Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline">{t('paymentMethodsTitle')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard key={method.id} method={method} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}