'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { FAQ } from '@/lib/definitions';
import { deleteFaqAction } from '@/lib/actions';
import { ButtonWithConfirmation } from '@/components/ui/button-with-confirmation';
import { getFaqs } from '@/lib/data';
import { useTranslations } from 'next-intl';

function FaqRow({ faq, refreshFaqs }: { faq: FAQ; refreshFaqs: () => void }) {
  const t = useTranslations('Admin');

  return (
    <TableRow key={faq.id}>
      <TableCell className="font-medium">
        <Link href={`/admin/faqs/${faq.id}/edit`} className="hover:underline">{faq.question}</Link>
      </TableCell>
      <TableCell>{faq.orderIndex}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/admin/faqs/${faq.id}/edit`}>{t('edit')}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">{t('delete')}</DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteFaqConfirmationTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich('deleteFaqConfirmationDescription', {
                      faqQuestion: faq.question,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <form action={deleteFaqAction} onSubmit={() => setTimeout(refreshFaqs, 100)}> {/* Refresh after delete */}
                    <input type="hidden" name="id" value={faq.id} />
                    <ButtonWithConfirmation
                      variant="destructive"
                      confirmationText={t('delete')}
                      cancelText={t('cancel')}
                    />
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function FaqsPage() {
  const t = useTranslations('Admin');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFaqs = async () => {
    setIsLoading(true);
    const data = await getFaqs();
    setFaqs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t('faqsTitle')}</h1>
          <p className="text-muted-foreground">{t('faqsDescription')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/faqs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createFaq')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('faqQuestionColumn')}</TableHead>
                <TableHead>{t('faqOrderIndexColumn')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3}>{t('loading')}</TableCell></TableRow>}
              {faqs?.map((faq) => (
                <FaqRow key={faq.id} faq={faq} refreshFaqs={loadFaqs} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}