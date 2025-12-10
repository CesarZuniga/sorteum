'use client';

import { useState, useEffect } from 'react';
import { RaffleCard } from '@/components/raffle-card';
import type { Raffle, FAQ } from '@/lib/definitions';
import { getRaffles, getFaqs } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/logo'; // Importar el componente Logo
import { HomePaymentMethods } from '@/components/home-payment-methods'; // Importar el nuevo componente


function FaqSection() {
    const t = useTranslations('Index');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadFaqs() {
            setIsLoading(true);
            const faqsData = await getFaqs();
            setFaqs(faqsData);
            setIsLoading(false);
        }
        loadFaqs();
    }, []);

    return (
        <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight mb-2 font-headline">{t('faqTitle')}</h2>
                    <p className="text-muted-foreground">{t('faqSubtitle')}</p>
                </div>
                {isLoading ? (
                    <p className="text-center">{t('loadingFaqs')}</p>
                ) : (
                    <Accordion type="single" collapsible className="max-w-3xl mx-auto">
                        {faqs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id}>
                                <AccordionTrigger className="text-lg font-semibold text-left">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </section>
    );
}

function SiteFooter() {
    const t = useTranslations('Index');
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
                     <div>
                        <Logo className="text-white" /> {/* Usar el componente Logo aquí */}
                        <p className="text-sm text-gray-400 mt-2">{t('footerTagline')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3">{t('quickLinks')}</h4>
                        <ul className="space-y-2">
                            <li><Link href="/#active-raffles" className="hover:text-white text-sm">{t('activeRafflesLink')}</Link></li>
                            <li><Link href="/contact" className="hover:text-white text-sm">{t('contactLink')}</Link></li>
                            <li><Link href="/#faq" className="hover:text-white text-sm">{t('faqLink')}</Link></li>
                        </ul>
                    </div>
                    <div>
                         <h4 className="font-semibold mb-3">{t('followUs')}</h4>
                        <div className="flex space-x-4 justify-center md:justify-start">
                            <Link href="#" className="hover:text-white"><Twitter className="h-5 w-5"/></Link>
                            <Link href="#" className="hover:text-white"><Facebook className="h-5 w-5"/></Link>
                            <Link href="#" className="hover:text-white"><Instagram className="h-5 w-5"/></Link>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-700">
                    <p>© {new Date().getFullYear()} {t('copyright')}</p>
                    <div className="mt-2">
                        <Link href="#" className="hover:text-white">{t('termsAndConditions')}</Link>
                        <span className="mx-2">|</span>
                        <Link href="#" className="hover:text-white">{t('privacyPolicy')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default function Home() {
  const t = useTranslations('Index');
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const allRaffles = await getRaffles();
      const activeRaffles = allRaffles.filter(r => r.active);
      setRaffles(activeRaffles);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
          <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
              <Image 
                  src="https://picsum.photos/seed/car-hero/1200/800"
                  alt="Fondo de un carro de lujo"
                  fill
                  className="object-cover -z-10"
                  priority
                  data-ai-hint="luxury car"
              />
              <div className="absolute inset-0 bg-black/60 -z-10"></div>
              <div className="container px-4">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight !leading-tight font-headline mb-4 animate-fade-in-up">
                      {t('heroTitle')}
                  </h1>
                  <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-300">
                      {t('heroSubtitle')}
                  </p>
                  <Button size="lg" asChild className="animate-fade-in-up animation-delay-600">
                      <Link href="#active-raffles">{t('participateNow')}</Link>
                  </Button>
              </div>
          </section>

          <section id="active-raffles" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50">
              <div className="container mx-auto px-4">
                  <header className="text-center mb-12">
                      <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200 mb-2 font-headline">
                      {t('activeRafflesTitle')}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                      {t('activeRafflesSubtitle')}
                      </p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {isLoading && <p>{t('loadingRaffles')}</p>}
                  {raffles && raffles.map((raffle) => (
                      <RaffleCard key={raffle.id} raffle={raffle} />
                  ))}
                  </div>
              </div>
          </section>

          <HomePaymentMethods /> {/* Usamos el nuevo componente aquí */}
          <div id="faq">
          <FaqSection />
          </div>
          <SiteFooter />
      </main>
    </>
  );
}