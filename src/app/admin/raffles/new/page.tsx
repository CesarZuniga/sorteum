'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

function SubmitButton() {
  const t = useTranslations('Admin');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {t('createRaffleButton')}
    </Button>
  );
}

export default function NewRafflePage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const initialState = { message: undefined, errors: {}, success: false, raffleId: undefined };
  const [state, dispatch] = useActionState(createRaffleAction, initialState);

  useEffect(() => {
    if (state.success && state.raffleId) {
      router.push(`/admin/raffles/${state.raffleId}`);
    }
  }, [state.success, state.raffleId, router]);

  return (
    <div className="space-y-6">
       <Button variant="outline" size="sm" asChild>
          <Link href="/admin/raffles">
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('backToRaffle')}
          </Link>
      </Button>

      <form action={(f)=>dispatch(f)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('newRaffleTitle')}</CardTitle>
            <CardDescription>{t('newRaffleDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('raffleName')}</Label>
              <Input id="name" name="name" placeholder={t('exampleRaffleName')} />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea id="description" name="description" placeholder={t('exampleDescription')} />
              {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('ticketPrice')}</Label>
                    <Input id="price" name="price" type="number" step="0.01" placeholder="25.00" />
                    {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ticketCount">{t('totalTickets')}</Label>
                    <Input id="ticketCount" name="ticketCount" type="number" placeholder="100" />
                    {state.errors?.ticketCount && <p className="text-sm text-destructive">{state.errors.ticketCount[0]}</p>}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">{t('deadline')}</Label>
              <Input id="deadline" name="deadline" type="date" />
              {state.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">{t('imageURL')}</Label>
              <Input id="image" name="image" type="url" placeholder={t('exampleImageURL')} defaultValue={PlaceHolderImages[0].imageUrl} />
              {state.errors?.image && <p className="text-sm text-destructive">{state.errors.image[0]}</p>}
            </div>

            {state.message && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild><Link href="/admin/raffles">{t('cancel')}</Link></Button>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}