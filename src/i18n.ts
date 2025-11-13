import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

const locales = ['en', 'es'];

export default getRequestConfig(async () => {
  const locale = (await headers()).get('x-next-intl-locale') || 'es'; // Cambiado a 'es'

  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});