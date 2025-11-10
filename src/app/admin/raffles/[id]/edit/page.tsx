
'use client';

import { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { updateRaffleAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import {format} from 'date-fns/format'
import type { Raffle } from '@/lib/definitions';
import { getRaffleById } from '@/lib/data';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

export default function EditRafflePage({ params }: { params: { id: string } }) {
  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  
  const initialState = { message: undefined, errors: {} };
  const [state, dispatch] = useActionState(updateRaffleAction, initialState);

  useEffect(() => {
    async function loadRaffle() {
      const raffleData = await getRaffleById(params.id);
      setRaffle(raffleData);
    }
    loadRaffle();
  }, [params.id]);


  if (raffle === undefined) {
    return <div>Loading...</div>;
  }
  
  if (!raffle) {
    notFound();
  }
  
  const deadlineForInput = format(new Date(raffle.deadline), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
       <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/raffles/${raffle.id}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Raffle
          </Link>
      </Button>

      <form action={dispatch}>
        <input type="hidden" name="id" value={raffle.id} />
        <Card>
          <CardHeader>
            <CardTitle>Edit Raffle</CardTitle>
            <CardDescription>Update the details for the "{raffle.name}" raffle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Raffle Name</Label>
              <Input id="name" name="name" defaultValue={raffle.name} />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={raffle.description} />
              {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Ticket Price ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={raffle.price} />
                    {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ticketCount">Total Number of Tickets</Label>
                    <Input id="ticketCount" name="ticketCount" type="number" defaultValue={raffle.ticketCount} disabled />
                     <p className="text-xs text-muted-foreground">Ticket count cannot be changed after creation.</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" defaultValue={deadlineForInput} />
              {state.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
               <div className="flex items-center gap-4">
                    <Image src={raffle.image} alt={raffle.name} width={80} height={80} className="rounded-md object-cover" />
                    <Input id="image" name="image" type="url" defaultValue={raffle.image} />
                </div>
              {state.errors?.image && <p className="text-sm text-destructive">{state.errors.image[0]}</p>}
            </div>

            {state.message && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild><Link href={`/admin/raffles/${raffle.id}`}>Cancel</Link></Button>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
