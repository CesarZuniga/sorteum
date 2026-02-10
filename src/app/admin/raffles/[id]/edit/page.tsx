'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { format } from 'date-fns/format';
import type { Raffle } from '@/lib/definitions';
import { getRaffleById } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function EditRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const t = useTranslations('Admin');
  const router = useRouter();
  const [raffle, setRaffle] = useState<Raffle | null | undefined>(undefined);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [state, setState] = useState<{
    message?: string;
    errors?: Record<string, string[]>;
    success?: boolean;
    raffleId?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function loadRaffle() {
      const raffleData = await getRaffleById(resolvedParams.id);
      setRaffle(raffleData);
    }
    loadRaffle();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (state.success && state.raffleId) {
      router.push(`/admin/raffles/${state.raffleId}`);
    }
  }, [state.success, state.raffleId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateRaffleAction({}, formData);
      setState(result);
    } catch {
      setState({ message: 'An unexpected error occurred.', success: false });
    } finally {
      setIsPending(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
  };

  if (raffle === undefined) {
    return <div>{t('loading')}</div>;
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
              {t('backToRaffle')}
          </Link>
      </Button>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="id" value={raffle.id} />
        <Card>
          <CardHeader>
            <CardTitle>{t('editRaffleTitle')}</CardTitle>
            <CardDescription>
              {t.rich('editRaffleDescription', {
                raffleName: raffle.name,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('raffleName')}</Label>
              <Input id="name" name="name" defaultValue={raffle.name} />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea id="description" name="description" defaultValue={raffle.description} />
              {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">{t('ticketPrice')}</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={raffle.price} />
                    {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ticketCount">{t('totalTickets')}</Label>
                    <Input id="ticketCount" name="ticketCount" type="number" defaultValue={raffle.ticketCount} disabled />
                     <p className="text-xs text-muted-foreground">{t('ticketCountCannotChange')}</p>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">{t('deadline')}</Label>
              <Input id="deadline" name="deadline" type="date" defaultValue={deadlineForInput} />
              {state.errors?.deadline && <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageFiles">{t('imageUpload')}</Label>
               <div className="flex flex-wrap items-center gap-4">
                    {raffle.images.length > 0 && imagePreviews.length === 0 && (
                        raffle.images.map((src, index) => (
                            <div key={`existing-${index}`} className="relative h-24 w-24 rounded-md overflow-hidden">
                                <Image src={src} alt={`${raffle.name} image ${index + 1}`} fill className="object-cover" />
                            </div>
                        ))
                    )}
                    {imagePreviews.length > 0 && (
                        imagePreviews.map((src, index) => (
                            <div key={`new-${index}`} className="relative h-24 w-24 rounded-md overflow-hidden">
                                <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover" />
                            </div>
                        ))
                    )}
                    <Input
                        id="imageFiles"
                        name="imageFiles"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </div>
              <p className="text-xs text-muted-foreground">{t('imageUploadHint')}</p>
              {state.errors?.imageFiles && <p className="text-sm text-destructive">{state.errors.imageFiles[0]}</p>}
            </div>

            {state.message && !state.success && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('errorTitle')}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild><Link href={`/admin/raffles/${raffle.id}`}>{t('cancel')}</Link></Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t('savingChanges') : t('saveChanges')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
