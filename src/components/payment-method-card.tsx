'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaymentMethod } from '@/lib/definitions';
import { Banknote, User, CreditCard as CreditCardIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaymentMethodCardProps {
  method: PaymentMethod;
}

export function PaymentMethodCard({ method }: PaymentMethodCardProps) {
  const t = useTranslations('RaffleDetail');

  return (
    <Card className="relative overflow-hidden group">
      {method.bankImageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={method.bankImageUrl}
            alt={method.bankName}
            fill
            className="object-contain object-center"
            data-ai-hint={`Bank logo for ${method.bankName}`}
          />
        </div>
      )}
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 p-6">
        
        <Banknote className="h-5 w-5 text-muted-foreground" /> {/* Cambiado a text-muted-foreground */}
      </CardHeader>
      <CardContent className="relative z-10 space-y-2 p-6">
        <div className="flex items-center gap-2 text-sm">
          <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('accountNumber')}: <strong>{method.accountNumber}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('recipientName')}: <strong>{method.recipientName}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}