'use client';

import { useAppLocale } from './locale-provider';

export function LocaleSwitcher() {
  const { locale, setLocale } = useAppLocale();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'es'
            ? 'bg-white text-black font-bold'
            : 'text-white/70 hover:text-white'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'en'
            ? 'bg-white text-black font-bold'
            : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
