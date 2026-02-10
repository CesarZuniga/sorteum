import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import { LocaleProvider } from '@/components/locale-provider';
import messagesEs from '@/messages/es.json';
import messagesEn from '@/messages/en.json';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sorteum Digital',
  description: 'The easiest way to manage and participate in online raffles.',
};

const allMessages = { es: messagesEs, en: messagesEn };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <head />
      <body className={`${inter.variable} font-body antialiased bg-background text-foreground`}>
        <LocaleProvider allMessages={allMessages}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
