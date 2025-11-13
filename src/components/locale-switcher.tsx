'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation'; // usePathname no es necesario aquí

const COOKIE_NAME = 'NEXT_LOCALE';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const onSelectChange = (nextLocale: string) => {
    // Solo actualizamos si el idioma realmente cambia
    if (nextLocale !== locale) {
      // Actualizar la cookie
      document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000`; // 1 año

      // Refrescar la página para aplicar el nuevo idioma (el renderizado del servidor lo recogerá)
      router.refresh();
    }
  };

  return (
    <Select onValueChange={onSelectChange} value={locale}> {/* Cambiado defaultValue a value */}
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