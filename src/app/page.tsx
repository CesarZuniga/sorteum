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


function SecurePayments() {
    // Dummy SVGs for payment providers
    const VisaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="40" viewBox="0 0 38 24" fill="none"><path d="M37.56 5.372c-.144-.504-.504-.882-.99-.99C34.938 3.83 31.86 3 28.5 3H1c-.552 0-1 .448-1 1v16c0 .552.448 1 1 1h36c.552 0 1-.448 1-1V6.362c0-.44-.288-.828-.708-.954l.268-.036z" fill="#fff" stroke="#d5d5d5" strokeWidth="2"></path><path d="M32.89 4.354L31.15 19.65h-4.062l1.74-15.296h4.062zM21.01 4.354l-2.142 12.33-1.638-12.33h-4.32l-3.33 15.3h4.32l1.242-7.056 1.224 7.056h3.42l3.438-15.3h-4.2zM8.398 4.354l-1.8 8.136- .522-3.888c-.126-.918-.846-1.53-1.782-1.53-.414 0-.792.162-1.08.432l-.846 4.338L.61 4.354H4.75l1.512 8.784L8.398 4.354h-1.44z" fill="#0157a2"></path><path d="M33.01 4.354h3.6l-2.52 15.3h-3.6z" fill="#fbb040"></path></svg>
    const MasterCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="40" viewBox="0 0 64 40"><path fill="#FF5F00" d="M26 12c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z"></path><path fill="#EB001B" d="M40.5 12c-3.487 0-6.543 1.786-8.318 4.505C33.91 14.128 36.57 12 39.5 12c5.25 0 9.5 4.25 9.5 9.5s-4.25 9.5-9.5 9.5c-2.93 0-5.59-1.128-7.5-3.005C33.957 29.786 37.013 31.5 40.5 31.5c5.523 0 10-4.477 10-10s-4.477-10-10-10z"></path><path fill="#F79E1B" d="M35.182 16.505C33.457 13.786 30.49 12 27 12c-5.523 0-10 4.477-10 10s4.477 10 10 10c3.49 0 6.543-1.786 8.318-4.505C29.09 29.872 26.43 32 23.5 32c-5.25 0-9.5-4.25-9.5-9.5S18.25 13 23.5 13c2.93 0 5.59 1.128 7.5 3.005z"></path></svg>

    return (
        <section className="bg-white dark:bg-gray-800 py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight mb-2 font-headline">Aceptamos Pagos Seguros</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Tu seguridad es nuestra prioridad. Utilizamos las pasarelas de pago más confiables del mercado.
                </p>
                <div className="flex justify-center items-center gap-8">
                    <VisaIcon />
                    <MasterCardIcon />
                </div>
            </div>
        </section>
    );
}

function FaqSection() {
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
                    <h2 className="text-3xl font-bold tracking-tight mb-2 font-headline">Preguntas Frecuentes</h2>
                    <p className="text-muted-foreground">¿Tienes dudas? Encuentra here las respuestas a las preguntas más comunes.</p>
                </div>
                {isLoading ? (
                    <p className="text-center">Cargando preguntas frecuentes...</p>
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
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
                     <div>
                        <span className="text-lg font-bold">Sorteum</span>
                        <p className="text-sm text-gray-400 mt-2">Gana el premio de tus sueños.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3">Enlaces Rápidos</h4>
                        <ul className="space-y-2">
                            <li><Link href="/#active-raffles" className="hover:text-white text-sm">Rifas Activas</Link></li>
                            <li><Link href="/contact" className="hover:text-white text-sm">Contacto</Link></li>
                            <li><Link href="/#faq" className="hover:text-white text-sm">Preguntas Frecuentes</Link></li>
                        </ul>
                    </div>
                    <div>
                         <h4 className="font-semibold mb-3">Síguenos</h4>
                        <div className="flex space-x-4 justify-center md:justify-start">
                            <Link href="#" className="hover:text-white"><Twitter className="h-5 w-5"/></Link>
                            <Link href="#" className="hover:text-white"><Facebook className="h-5 w-5"/></Link>
                            <Link href="#" className="hover:text-white"><Instagram className="h-5 w-5"/></Link>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-700">
                    <p>© {new Date().getFullYear()} Sorteum Digital. Todos los derechos reservados.</p>
                    <div className="mt-2">
                        <Link href="#" className="hover:text-white">Términos y Condiciones</Link>
                        <span className="mx-2">|</span>
                        <Link href="#" className="hover:text-white">Política de Privacidad</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default function Home() {
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
                      ¡Gana el Premio de tus Sueños!
                  </h1>
                  <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-300">
                      Por la fracción de su costo, te ofrecemos la oportunidad de llevarte a casa premios increíbles. ¡No te quedes fuera!
                  </p>
                  <Button size="lg" asChild className="animate-fade-in-up animation-delay-600">
                      <Link href="#active-raffles">Participa Ahora</Link>
                  </Button>
              </div>
          </section>

          <section id="active-raffles" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50">
              <div className="container mx-auto px-4">
                  <header className="text-center mb-12">
                      <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200 mb-2 font-headline">
                      Rifas Activas
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                      Explora nuestras rifas actuales y elige tu próximo gran premio. ¿La suerte está de tu lado?
                      </p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {isLoading && <p>Cargando rifas...</p>}
                  {raffles && raffles.map((raffle) => (
                      <RaffleCard key={raffle.id} raffle={raffle} />
                  ))}
                  </div>
              </div>
          </section>

          <SecurePayments />
          <div id="faq">
          <FaqSection />
          </div>
          <SiteFooter />
      </main>
    </>
  );
}