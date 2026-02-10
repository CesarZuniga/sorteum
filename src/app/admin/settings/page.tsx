'use client';

import { useState, useEffect, useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSettings } from '@/lib/data';
import { updateSettingsAction } from '@/lib/actions';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const t = useTranslations('Admin');
  const { toast } = useToast();
  const [reservationDuration, setReservationDuration] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  const [state, formAction, isPending] = useActionState(updateSettingsAction, {});

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        setReservationDuration(settings.reservationDurationMinutes);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast({ title: t('settingsUpdatedSuccess') });
    } else if (state?.message && !state?.success && state.success !== undefined) {
      toast({ title: t('failedToUpdateSettings'), description: state.message, variant: 'destructive' });
    }
  }, [state, toast, t]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settingsTitle')}</h1>
        <p className="text-muted-foreground">{t('settingsDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reservationDurationLabel')}</CardTitle>
          <CardDescription>{t('reservationDurationHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="max-w-xs">
              <Label htmlFor="reservationDurationMinutes">{t('reservationDurationLabel')}</Label>
              <Input
                id="reservationDurationMinutes"
                name="reservationDurationMinutes"
                type="number"
                min={1}
                max={1440}
                value={reservationDuration}
                onChange={(e) => setReservationDuration(parseInt(e.target.value, 10) || 1)}
              />
              {state?.errors?.reservationDurationMinutes && (
                <p className="text-sm text-destructive mt-1">{state.errors.reservationDurationMinutes[0]}</p>
              )}
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('savingSettings') : t('saveSettings')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
