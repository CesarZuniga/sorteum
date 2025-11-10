
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <header className="relative flex items-center justify-center mb-8">
            <Link href="/" className="absolute left-0">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                    <span className="sr-only">Volver</span>
                </Button>
            </Link>
            <h1 className="text-xl font-semibold">Contacto</h1>
        </header>

        <main>
          <div className="text-left mb-8">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Estamos aquí para ayudarte</h2>
            <p className="text-muted-foreground mt-2">
              Envíanos tus dudas o sugerencias. Te responderemos a la brevedad.
            </p>
          </div>

          <form className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" placeholder="Ingresa tu nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Tu Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="ejemplo@correo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Tu Mensaje</Label>
              <Textarea id="message" placeholder="Escribe tu mensaje aquí..." rows={5} />
            </div>
            <Button type="submit" size="lg" className="w-full !mt-8 bg-red-600 hover:bg-red-700">
              Enviar Mensaje
            </Button>
          </form>

          <div className="text-center mt-8 space-y-4">
             <div>
                <p className="text-muted-foreground text-sm">Otras formas de contactarnos</p>
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
              Al enviar este formulario, aceptas nuestra{' '}
              <Link href="#" className="underline hover:text-primary">
                Política de Privacidad
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
