'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { FAQ } from '@/lib/definitions';
import { useTranslations } from 'next-intl';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const t = useTranslations('Admin');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? t('saveChanges') : t('createFaqButton')}
    </Button>
  );
}

interface FaqFormProps {
  faq?: FAQ; // Optional FAQ object for editing
  state: {
    errors?: {
      question?: string[];
      answer?: string[];
      orderIndex?: string[];
    };
    message?: string;
    success?: boolean;
    faqId?: string;
  };
  action: (formData: FormData) => void;
}

export function FaqForm({ faq, state, action }: FaqFormProps) {
  const t = useTranslations('Admin');
  const isEditing = !!faq;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/faqs">
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('backToFaqs')}
        </Link>
      </Button>

      <form action={action}>
        {isEditing && <input type="hidden" name="id" value={faq.id} />}
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? t('editFaqTitle') : t('newFaqTitle')}</CardTitle>
            <CardDescription>
              {isEditing ? t.rich('editFaqDescription', { faqQuestion: faq?.question }) : t('newFaqDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">{t('faqQuestion')}</Label>
              <Input id="question" name="question" placeholder={t('exampleFaqQuestion')} defaultValue={faq?.question} />
              {state.errors?.question && <p className="text-sm text-destructive">{state.errors.question[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">{t('faqAnswer')}</Label>
              <Textarea id="answer" name="answer" placeholder={t('exampleFaqAnswer')} defaultValue={faq?.answer} />
              {state.errors?.answer && <p className="text-sm text-destructive">{state.errors.answer[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">{t('faqOrderIndex')}</Label>
              <Input id="orderIndex" name="orderIndex" type="number" placeholder="0" defaultValue={faq?.orderIndex ?? 0} />
              {state.errors?.orderIndex && <p className="text-sm text-destructive">{state.errors.orderIndex[0]}</p>}
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
              <Link href="/admin/faqs">{t('cancel')}</Link>
            </Button>
            <SubmitButton isEditing={isEditing} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}