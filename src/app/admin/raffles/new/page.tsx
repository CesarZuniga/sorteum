
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createRaffleAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create Raffle
    </Button>
  );
}

export default function NewRafflePage() {
  const initialState = { message: undefined, errors: {} };
  const [state, dispatch] = useActionState(createRaffleAction, initialState);

  return (
    <div className="space-y-6">
       <Button variant="outline" size="sm" asChild>
          <Link href="/admin/raffles">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Raffles
          </Link>
      </Button>

      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Raffle</CardTitle>
            <CardDescription>Fill out the details below to launch a new raffle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Raffle Name</Label>
              <Input id="name" name="name" placeholder="e.g., Luxury Watch Raffle" />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A brief description of the raffle prize." />
              {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Ticket Price ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" placeholder="25.00" />
                    {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ticketCount">Total Number of Tickets</Label>
                    <Input id="ticketCount" name="ticketCount" type="number" placeholder="100" />
                    {state.errors?.ticketCount && <p className="text-sm text-destructive">{state.errors.ticketCount[0]}</p>}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" />
              {state.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" type="url" placeholder="https://example.com/image.png" defaultValue={PlaceHolderImages[0].imageUrl} />
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
            <Button variant="ghost" asChild><Link href="/admin/raffles">Cancel</Link></Button>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
