'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react'; // Import useState
import { useFormStatus } from 'react-dom';
import { createRaffleAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react'; // Import ImageIcon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image'; // Import Image component

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // State for image previews

  useEffect(() => {
    if (state.success && state.raffleId) {
      router.push(`/admin/raffles/${state.raffleId}`);
    }
  }, [state.success, state.raffleId, router]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
  };

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
              <Label htmlFor="imageFiles">{t('imageUpload')}</Label> {/* Updated label */}
              <Input 
                id="imageFiles" 
                name="imageFiles" 
                type="file" 
                multiple // Allow multiple file selection
                accept="image/*" // Accept only image files
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">{t('imageUploadHint')}</p> {/* New hint */}
              {state.errors?.imageFiles && <p className="text-sm text-destructive">{state.errors.imageFiles[0]}</p>} {/* Updated error field */}
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative h-24 w-24 rounded-md overflow-hidden">
                      <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
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