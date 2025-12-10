'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { PaymentMethod } from '@/lib/definitions';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Image from 'next/image';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const t = useTranslations('Admin');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? t('saveChanges') : t('createPaymentMethodButton')}
    </Button>
  );
}

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod; // Optional PaymentMethod object for editing
  state: {
    errors?: {
      bankName?: string[];
      accountNumber?: string[];
      recipientName?: string[];
      imageFile?: string[]; // Error for image file
    };
    message?: string;
    success?: boolean;
    paymentMethodId?: string;
  };
  action: (formData: FormData) => void;
}

export function PaymentMethodForm({ paymentMethod, state, action }: PaymentMethodFormProps) {
  const t = useTranslations('Admin');
  const isEditing = !!paymentMethod;
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImagePreview(URL.createObjectURL(event.target.files[0]));
    } else {
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/payment-methods">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('backToPaymentMethods')}
        </Link>
      </Button>

      <form action={action}>
        {isEditing && <input type="hidden" name="id" value={paymentMethod.id} />}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? t('editPaymentMethodTitle') : t('newPaymentMethodTitle')}</CardTitle>
            <CardDescription>
              {isEditing ? t.rich('editPaymentMethodDescription', { bankName: paymentMethod?.bankName }) : t('newPaymentMethodDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">{t('paymentMethodBankName')}</Label>
              <Input id="bankName" name="bankName" placeholder={t('exampleBankName')} defaultValue={paymentMethod?.bankName} />
              {state.errors?.bankName && <p className="text-sm text-destructive">{state.errors.bankName[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">{t('paymentMethodAccountNumber')}</Label>
              <Input id="accountNumber" name="accountNumber" placeholder={t('exampleAccountNumber')} defaultValue={paymentMethod?.accountNumber} />
              {state.errors?.accountNumber && <p className="text-sm text-destructive">{state.errors.accountNumber[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientName">{t('paymentMethodRecipientName')}</Label>
              <Input id="recipientName" name="recipientName" placeholder={t('exampleRecipientName')} defaultValue={paymentMethod?.recipientName} />
              {state.errors?.recipientName && <p className="text-sm text-destructive">{state.errors.recipientName[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageFile">{t('paymentMethodBankImage')}</Label>
              <Input 
                id="imageFile" 
                name="imageFile" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">{t('paymentMethodBankImageHint')}</p>
              {state.errors?.imageFile && <p className="text-sm text-destructive">{state.errors.imageFile[0]}</p>}
              
              {(imagePreview || paymentMethod?.bankImageUrl) && (
                <div className="mt-4 relative h-24 w-24 rounded-md overflow-hidden border">
                  <Image 
                    src={imagePreview || paymentMethod?.bankImageUrl || ''} 
                    alt="Bank preview" 
                    fill 
                    className="object-contain" 
                  />
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
            <Button variant="ghost" asChild>
              <Link href="/admin/payment-methods">{t('cancel')}</Link>
            </Button>
            <SubmitButton isEditing={isEditing} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}