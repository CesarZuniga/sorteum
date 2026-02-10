'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { PaymentMethod } from '@/lib/definitions';
import { User, CreditCard as CreditCardIcon, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaymentMethodCardProps {
  method: PaymentMethod;
}

export function PaymentMethodCard({ method }: PaymentMethodCardProps) {
  const t = useTranslations('RaffleDetail');

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        {method.bankImageUrl ? (
          <div className="relative h-12 w-12 flex-shrink-0">
            <Image
              src={method.bankImageUrl}
              alt={method.bankName}
              fill
              className="object-contain"
              data-ai-hint={`Bank logo for ${method.bankName}`}
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted">
            <Banknote className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold truncate">{method.bankName}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCardIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{method.accountNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{method.recipientName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
