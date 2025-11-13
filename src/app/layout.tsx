import type { Metadata } from 'next';
import './globals.css'; // Ruta corregida
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers'; // Importar cookies para leer en el servidor

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sorteum Digital',
  description: 'The easiest way to manage and participate in online raffles.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'; // Leer el locale de la cookie

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Las etiquetas link para las fuentes se eliminan, next/font las inyecta automáticamente */}
      </head>
      <body className={`${inter.variable} font-body antialiased bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages} locale={locale}> {/* Pasar el locale a NextIntlClientProvider */}
          <SessionProvider>
            {children}
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}