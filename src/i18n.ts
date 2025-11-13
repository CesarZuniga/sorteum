import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

const locales = ['en', 'es'];

export default getRequestConfig(async () => {
  const locale = headers().get('x-next-intl-locale') || 'en'; // Fallback to 'en' if header is missing

  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./src/messages/${locale}.json`)).default
  };
});