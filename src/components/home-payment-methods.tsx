'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getPaymentMethods } from '@/lib/data';
import type { PaymentMethod } from '@/lib/definitions';
import { PaymentMethodCard } from './payment-method-card';
import { FadeIn } from '@/components/fade-in';

export function HomePaymentMethods() {
  const t = useTranslations('Index');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPaymentMethods() {
      setIsLoading(true);
      const data = await getPaymentMethods();
      setPaymentMethods(data);
      setIsLoading(false);
    }
    loadPaymentMethods();
  }, []);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <FadeIn>
        <h2 className="text-3xl font-bold tracking-tight mb-2 font-headline">{t('paymentMethodsTitleHome')}</h2>
        </FadeIn>

        {isLoading ? (
          <p className="text-muted-foreground">{t('loadingPaymentMethods')}</p>
        ) : (
          <>
            {paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {paymentMethods.map((method, i) => (
                  <FadeIn key={method.id} delay={i * 100}>
                  <PaymentMethodCard method={method} />
                  </FadeIn>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noPaymentMethodsAvailable')}</p>
            )}
            <p className="text-muted-foreground mt-8 max-w-2xl mx-auto">
              {t('paymentMethodsSubtitleHome')}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
