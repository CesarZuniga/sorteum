'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createFaqAction } from '@/lib/actions';
import { FaqForm } from '@/components/admin/faq-form';
import { useTranslations } from 'next-intl';

export default function NewFaqPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const initialState = { message: undefined, errors: {}, success: false, faqId: undefined };
  const [state, dispatch] = useActionState(createFaqAction, initialState);

  useEffect(() => {
    if (state.success && state.faqId) {
      router.push('/admin/faqs');
    }
  }, [state.success, state.faqId, router]);

  return <FaqForm state={state} action={dispatch} />;
}