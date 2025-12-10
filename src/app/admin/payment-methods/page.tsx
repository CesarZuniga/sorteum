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
import type { PaymentMethod } from '@/lib/definitions';
import { deletePaymentMethodAction } from '@/lib/actions';
import { ButtonWithConfirmation } from '@/components/ui/button-with-confirmation';
import { getPaymentMethods } from '@/lib/data';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

function PaymentMethodRow({ paymentMethod, refreshPaymentMethods }: { paymentMethod: PaymentMethod; refreshPaymentMethods: () => void }) {
  const t = useTranslations('Admin');

  return (
    <TableRow key={paymentMethod.id}>
      <TableCell className="font-medium">
        <Link href={`/admin/payment-methods/${paymentMethod.id}/edit`} className="hover:underline">{paymentMethod.bankName}</Link>
      </TableCell>
      <TableCell>{paymentMethod.accountNumber}</TableCell>
      <TableCell>{paymentMethod.recipientName}</TableCell>
      <TableCell>
        {paymentMethod.bankImageUrl ? (
          <div className="relative w-[60px] h-[30px]">
            <Image src={paymentMethod.bankImageUrl} alt={paymentMethod.bankName} fill className="object-contain" />
          </div>
        ) : (
          <span>N/A</span>
        )}
      </TableCell>
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
            <DropdownMenuItem asChild><Link href={`/admin/payment-methods/${paymentMethod.id}/edit`}>{t('edit')}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">{t('delete')}</DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deletePaymentMethodConfirmationTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich('deletePaymentMethodConfirmationDescription', {
                      bankName: paymentMethod.bankName,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <form action={deletePaymentMethodAction} onSubmit={() => setTimeout(refreshPaymentMethods, 100)}>
                    <input type="hidden" name="id" value={paymentMethod.id} />
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

export default function PaymentMethodsPage() {
  const t = useTranslations('Admin');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    const data = await getPaymentMethods();
    setPaymentMethods(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{t('paymentMethodsTitle')}</h1>
          <p className="text-muted-foreground">{t('paymentMethodsDescription')}</p>
        </div>
        <Button asChild>
          <Link href="/admin/payment-methods/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createPaymentMethod')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('paymentMethodBankNameColumn')}</TableHead>
                <TableHead>{t('paymentMethodAccountNumberColumn')}</TableHead>
                <TableHead>{t('paymentMethodRecipientNameColumn')}</TableHead>
                <TableHead>{t('paymentMethodBankImageColumn')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>{t('loading')}</TableCell></TableRow>}
              {paymentMethods?.map((method) => (
                <PaymentMethodRow key={method.id} paymentMethod={method} refreshPaymentMethods={loadPaymentMethods} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}