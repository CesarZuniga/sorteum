'use client';

import { useEffect, useState, useActionState } from 'react';
import { notFound } from 'next/navigation';
import { updatePaymentMethodAction } from '@/lib/actions';
import { PaymentMethodForm } from '@/components/admin/payment-method-form';
import type { PaymentMethod } from '@/lib/definitions';
import { getPaymentMethodById } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function EditPaymentMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null | undefined>(undefined);

  const resolvedParams = React.use(params);
  const paymentMethodId = resolvedParams.id;

  const initialState = { message: undefined, errors: {}, success: false, paymentMethodId: undefined };
  const [state, dispatch] = useActionState(updatePaymentMethodAction, initialState);

  useEffect(() => {
    async function loadPaymentMethod() {
      const methodData = await getPaymentMethodById(paymentMethodId);
      setPaymentMethod(methodData);
    }
    loadPaymentMethod();
  }, [paymentMethodId]);

  useEffect(() => {
    if (state.success && state.paymentMethodId) {
      router.push('/admin/payment-methods');
    }
  }, [state.success, state.paymentMethodId, router]);

  if (paymentMethod === undefined) {
    return <div>{t('loading')}</div>;
  }

  if (!paymentMethod) {
    notFound();
  }

  return <PaymentMethodForm paymentMethod={paymentMethod} state={state} action={dispatch} />;
}