'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('Contact');
  const tIndex = useTranslations('Index');
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <header className="relative flex items-center justify-center mb-8">
            <Link href="/" className="absolute left-0">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                    <span className="sr-only">{tIndex('backToRaffle')}</span>
                </Button>
            </Link>
            <h1 className="text-xl font-semibold">{t('title')}</h1>
        </header>

        <main>
          <div className="text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('headline')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('subtitle')}
            </p>
          </div>

          <form className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')}</Label>
              <Input id="name" placeholder={t('enterName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('yourEmail')}</Label>
              <Input id="email" type="email" placeholder={t('enterEmail')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('yourMessage')}</Label>
              <Textarea id="message" placeholder={t('writeMessage')} rows={5} />
            </div>
            <Button type="submit" size="lg" className="w-full !mt-8 bg-red-600 hover:bg-red-700">
              {t('sendMessage')}
            </Button>
          </form>

          <div className="text-center mt-8 space-y-4">
             <div>
                <p className="text-muted-foreground text-sm">{t('otherWaysToContact')}</p>
                <div className="flex justify-center space-x-4 mt-2">
                    <Button asChild variant="outline" size="icon" className="rounded-full">
                        <Link href="#"><Facebook className="h-5 w-5"/></Link>
                    </Button>
                     <Button asChild variant="outline" size="icon" className="rounded-full">
                        <Link href="#"><Twitter className="h-5 w-5"/></Link>
                    </Button>
                     <Button asChild variant="outline" size="icon" className="rounded-full">
                        <Link href="#"><Instagram className="h-5 w-5"/></Link>
                    </Button>
                </div>
             </div>
            <p className="text-xs text-muted-foreground px-4">
              {t.rich('privacyPolicyAcceptance', {
                privacyPolicyLink: (chunks) => (
                  <Link href="#" className="underline hover:text-primary">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}