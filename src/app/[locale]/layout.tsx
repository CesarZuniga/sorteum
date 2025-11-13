import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider'; // Import SessionProvider
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter', // Define una variable CSS para Tailwind
});

export const metadata: Metadata = {
  title: 'Sorteum Digital',
  description: 'The easiest way to manage and participate in online raffles.',
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Las etiquetas link para las fuentes se eliminan, next/font las inyecta automáticamente */}
      </head>
      <body className={`${inter.variable} font-body antialiased bg-background text-foreground`}>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider> {/* Wrap children with SessionProvider */}
            {children}
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}