'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { updateTicketStatus, getRaffleById, getPaginatedTickets, getPaymentMethods, getRandomAvailableTickets, getSettings, getTicketByNumber } from '@/lib/data';
import type { Ticket, Raffle, PaymentMethod } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Calendar, DollarSign, Ticket as TicketIcon, Shuffle, Check, Clock, Search, Loader2 } from 'lucide-react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { PaymentMethodCard } from '@/components/payment-method-card';
import { FadeIn } from '@/components/fade-in';

const PAGE_SIZE = 200;

const TicketItem = ({ ticket, onSelect, isSelected, isSuggested }: { ticket: Ticket, onSelect: (ticket: Ticket) => void, isSelected: boolean, isSuggested: boolean }) => {
  const getStatusClasses = () => {
    switch (ticket.status) {
      case 'paid':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-500 text-white cursor-not-allowed';
      case 'available':
        if (isSelected) return 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 scale-105';
        if (isSuggested) return 'bg-blue-300 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600';
        return 'bg-muted hover:bg-secondary';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <button
      disabled={ticket.status !== 'available'}
      onClick={() => onSelect(ticket)}
      className={`flex items-center justify-center p-2 min-h-[44px] rounded-lg font-semibold transition-all duration-200 ${getStatusClasses()}`}
      aria-label={`Ticket number ${ticket.number}, status ${ticket.status}${isSelected ? ', selected' : ''}${isSuggested ? ', suggested' : ''}`}
    >
      {String(ticket.number).padStart(3, '0')}
    </button>
  );
};

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const resolvedRaffleId = resolvedParams.id;
  const t = useTranslations('RaffleDetail');
  const tIndex = useTranslations('Index');

  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [reservationMinutes, setReservationMinutes] = useState<number>(15);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [suggestedTickets, setSuggestedTickets] = useState<Ticket[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
  const [randomCount, setRandomCount] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Ticket | null | undefined>(undefined);
  const [isReserving, setIsReserving] = useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (resolvedRaffleId) {
      async function loadInitialData() {
        setIsInitialLoad(true);
        const [raffleData, ticketsResult, paymentMethodsData, settingsData] = await Promise.all([
          getRaffleById(resolvedRaffleId),
          getPaginatedTickets(resolvedRaffleId, { page: 1, pageSize: PAGE_SIZE }),
          getPaymentMethods(),
          getSettings(),
        ]);
        setRaffle(raffleData);
        setTickets(ticketsResult.tickets);
        setTotalCount(ticketsResult.totalCount);
        setHasMore(ticketsResult.page < ticketsResult.totalPages);
        setCurrentPage(1);
        setPaymentMethods(paymentMethodsData);
        setReservationMinutes(settingsData.reservationDurationMinutes);
        setIsInitialLoad(false);
      }
      loadInitialData();
    }
  }, [resolvedRaffleId]);

  const loadMoreTickets = useCallback(async () => {
    if (!resolvedRaffleId || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getPaginatedTickets(resolvedRaffleId, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setTickets(prev => [...prev, ...result.tickets]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < result.totalPages);
    } catch (error) {
      console.error('Error loading more tickets:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [resolvedRaffleId, currentPage, isLoadingMore, hasMore]);

  useEffect(() => {
    if (isInitialLoad) return;
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreTickets();
        }
      },
      {
        root: container,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isInitialLoad, hasMore, isLoadingMore, loadMoreTickets]);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);


  if (raffle === undefined || isInitialLoad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-[3/2] w-full rounded-lg animate-shimmer" />
            <div className="h-10 w-3/4 rounded-lg animate-shimmer" />
            <div className="h-6 w-full rounded-lg animate-shimmer" />
          </div>
          <div className="space-y-4">
            <div className="h-96 w-full rounded-lg animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!raffle) {
    notFound();
  }

  const refreshTickets = async () => {
    if (resolvedRaffleId) {
      const result = await getPaginatedTickets(resolvedRaffleId, { page: 1, pageSize: PAGE_SIZE });
      setTickets(result.tickets);
      setTotalCount(result.totalCount);
      setCurrentPage(1);
      setHasMore(result.page < result.totalPages);
    }
  };

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

  const handleRandomSelect = async () => {
    if (!resolvedRaffleId) return;
    try {
      const excludeNumbers = selectedTickets.map(t => t.number);
      const randomTickets = await getRandomAvailableTickets(resolvedRaffleId, randomCount, excludeNumbers);

      if (randomTickets.length === 0) {
        toast({
          title: t('insufficientTicketsTitle'),
          description: t.rich('insufficientTicketsDescription', { availableCount: 0 }),
          variant: 'destructive',
        });
        setSuggestedTickets([]);
        return;
      }

      if (randomTickets.length < randomCount) {
        toast({
          title: t('insufficientTicketsTitle'),
          description: t.rich('insufficientTicketsDescription', { availableCount: randomTickets.length }),
          variant: 'destructive',
        });
      }

      setSuggestedTickets(randomTickets);
    } catch (error) {
      console.error('Error getting random tickets:', error);
      toast({ title: t('insufficientTicketsTitle'), description: String(error), variant: 'destructive' });
    }
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

    setIsReserving(true);
    try {
      const currentTotal = formatCurrency(selectedTickets.length * raffle.price);

      const promises = selectedTickets.map(ticket => {
        return updateTicketStatus(resolvedRaffleId, ticket.number, 'reserved', buyerInfo);
      });

      await Promise.all(promises);

      await refreshTickets();

      setSelectedTickets([]);
      setSuggestedTickets([]);
      setBuyerInfo({ name: '', email: '', phone: '' });

      toast({
        title: t('ticketsReservedTitle'),
        description: t.rich('ticketsReservedDescription', {
          minutes: reservationMinutes,
          totalPrice: currentTotal,
        }),
        action: (<div className="flex items-center"><Clock className="mr-2"/> {t('completePayment')}</div>)
      });
    } catch (error) {
      console.error('Error reserving tickets:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reserve tickets',
        variant: 'destructive',
      });
    } finally {
      setIsReserving(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResult(undefined);
      return;
    }

    const ticketNum = parseInt(value, 10);
    if (isNaN(ticketNum) || ticketNum < 1 || ticketNum > raffle.ticketCount) {
      setSearchResult(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const ticket = await getTicketByNumber(resolvedRaffleId, ticketNum);
        setSearchResult(ticket ?? null);
      } catch {
        setSearchResult(null);
      }
    }, 300);
  };

  const totalPrice = selectedTickets.length * raffle.price;
  const placeholder = PlaceHolderImages.find(p => p.imageUrls[0] === raffle.images[0]);

  const isSearching = searchTerm.trim().length > 0;
  const filteredTickets = isSearching
    ? (searchResult ? [searchResult] : [])
    : tickets;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {tIndex('backToRaffle')}
        </Link>
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <FadeIn direction="left">
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
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
              {count > 1 && (
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
              <span>{t('ends')} {format(new Date(raffle.deadline), 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </div>
        </FadeIn>

        <FadeIn direction="right" delay={150}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 font-headline">{t('selectYourTickets')}</h2>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('enterTicketNumber')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
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

              {suggestedTickets.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                  <strong>{t('suggestedTicketsLabel')}:</strong> {suggestedTickets.map(t => String(t.number).padStart(3, '0')).join(', ')}
                </p>
              )}

              <div
                ref={scrollContainerRef}
                className="h-[300px] w-full rounded-md border p-4 overflow-y-auto"
              >
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
                {isSearching && searchResult === null && (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {t('enterTicketNumber')}
                  </div>
                )}
                {!isSearching && (
                  <div ref={sentinelRef} className="flex items-center justify-center py-4">
                    {isLoadingMore && (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                    {!hasMore && tickets.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {tickets.length} / {totalCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-muted border border-border"></span>{t('available')}</div>
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
                  <Button type="submit" className="w-full" size="lg" disabled={isReserving}>
                    {isReserving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('reserveTickets')}</> : t('reserveTickets')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    {t('reservationNotice', { minutes: reservationMinutes })}
                  </p>
                </form>
              </CardContent>
            </Card>
          )}

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
        </FadeIn>
      </div>
    </div>
  );
}
