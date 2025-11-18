'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ChevronLeft } from 'lucide-react'; // Importar ChevronLeft
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Raffle } from '@/lib/definitions';
import { getRaffles } from '@/lib/data';
import Link from 'next/link'; // Importar Link

export default function CheckStatusPage() {
  const t = useTranslations('CheckStatus');
  const tIndex = useTranslations('Index'); // Para la traducción del botón de regreso
  const router = useRouter();
  const { toast } = useToast();
  const [raffleId, setRaffleId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loadingRaffles, setLoadingRaffles] = useState(true);

  useEffect(() => {
    async function loadRaffles() {
      setLoadingRaffles(true);
      const allRaffles = await getRaffles();
      const activeRaffles = allRaffles.filter(r => r.active);
      setRaffles(activeRaffles);
      if (activeRaffles.length > 0) {
        setRaffleId(activeRaffles[0].id); // Set default to the first active raffle
      }
      setLoadingRaffles(false);
    }
    loadRaffles();
  }, []);

  const handleStatusCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffleId.trim() || !ticketNumber.trim()) {
        toast({
            title: t('incompleteInfoTitle'),
            description: t('incompleteInfoDescription'),
            variant: 'destructive',
        });
        return;
    }
    
    setIsLoading(true);
    router.push(`/raffles/${raffleId.trim()}/tickets/${ticketNumber.trim()}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative"> {/* Añadir relative para posicionar el botón */}
          <div className="absolute left-4 top-4"> {/* Posicionar el botón */}
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{tIndex('backToRaffle')}</span>
              </Button>
            </Link>
          </div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
             <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">{t('headline')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleStatusCheck}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raffleId">{t('raffleId')}</Label>
              {loadingRaffles ? (
                <Input value={t('loadingRaffles')} disabled />
              ) : (
                <Select onValueChange={setRaffleId} value={raffleId} disabled={isLoading || raffles.length === 0}>
                  <SelectTrigger id="raffleId">
                    <SelectValue placeholder={t('selectRaffle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {raffles.length === 0 ? (
                      <SelectItem value="no-raffles" disabled>{t('noActiveRaffles')}</SelectItem>
                    ) : (
                      raffles.map((raffle) => (
                        <SelectItem key={raffle.id} value={raffle.id}>
                          {raffle.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketNumber">{t('ticketNumber')}</Label>
              <Input
                id="ticketNumber"
                type="number"
                placeholder={t('exampleTicket')}
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || raffles.length === 0}>
              {isLoading ? t('checking') : t('checkStatus')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}