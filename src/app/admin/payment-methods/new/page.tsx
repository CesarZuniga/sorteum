'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPaymentMethodAction } from '@/lib/actions';
import { PaymentMethodForm } from '@/components/admin/payment-method-form';
import { useTranslations } from 'next-intl';

export default function NewPaymentMethodPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const initialState = { message: undefined, errors: {}, success: false, paymentMethodId: undefined };
  const [state, dispatch] = useActionState(createPaymentMethodAction, initialState);

  useEffect(() => {
    if (state.success && state.paymentMethodId) {
      router.push('/admin/payment-methods');
    }
  }, [state.success, state.paymentMethodId, router]);

  return <PaymentMethodForm state={state} action={dispatch} />;
}