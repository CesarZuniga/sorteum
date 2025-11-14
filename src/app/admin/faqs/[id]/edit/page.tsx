'use client';

import { useEffect, useState, useActionState } from 'react';
import { notFound } from 'next/navigation';
import { updateFaqAction } from '@/lib/actions';
import { FaqForm } from '@/components/admin/faq-form';
import type { FAQ } from '@/lib/definitions';
import { getFaqById } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function EditFaqPage({ params }: { params: { id: string } }) {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [faq, setFaq] = useState<FAQ | null | undefined>(undefined);

  const initialState = { message: undefined, errors: {}, success: false, faqId: undefined };
  const [state, dispatch] = useActionState(updateFaqAction, initialState);

  useEffect(() => {
    async function loadFaq() {
      const faqData = await getFaqById(params.id);
      setFaq(faqData);
    }
    loadFaq();
  }, [params.id]);

  useEffect(() => {
    if (state.success && state.faqId) {
      router.push('/admin/faqs');
    }
  }, [state.success, state.faqId, router]);

  if (faq === undefined) {
    return <div>{t('loading')}</div>;
  }

  if (!faq) {
    notFound();
  }

  return <FaqForm faq={faq} state={state} action={dispatch} />;
}