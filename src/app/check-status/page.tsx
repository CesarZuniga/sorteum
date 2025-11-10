
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckStatusPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [raffleId, setRaffleId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffleId.trim() || !ticketNumber.trim()) {
        toast({
            title: 'Información Incompleta',
            description: 'Por favor, ingresa el ID de la rifa y el número del boleto.',
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
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
             <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Consultar Estado de Boleto</CardTitle>
          <CardDescription>Ingresa los detalles para ver el estado de tu boleto.</CardDescription>
        </CardHeader>
        <form onSubmit={handleStatusCheck}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raffleId">ID de la Rifa</Label>
              <Input
                id="raffleId"
                type="text"
                placeholder="Pega el ID de la rifa aquí"
                value={raffleId}
                onChange={(e) => setRaffleId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketNumber">Número de Boleto</Label>
              <Input
                id="ticketNumber"
                type="number"
                placeholder="Ej. 7"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Consultando...' : 'Consultar Estado'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
