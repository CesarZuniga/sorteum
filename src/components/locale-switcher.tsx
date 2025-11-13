'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const COOKIE_NAME = 'NEXT_LOCALE';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (nextLocale: string) => {
    // Update the cookie
    document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000`; // 1 year

    // Refresh the page to apply the new locale (server-side rendering will pick it up)
    router.refresh();
  };

  // Ensure the cookie is set on initial load if not present
  useEffect(() => {
    if (!document.cookie.includes(COOKIE_NAME)) {
      document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=31536000`;
    }
  }, [locale]);

  return (
    <Select onValueChange={onSelectChange} defaultValue={locale}>
      <SelectTrigger className="w-[100px] bg-transparent text-white border-white/50 hover:border-white">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Español</SelectItem>
      </SelectContent>
    </Select>
  );
}