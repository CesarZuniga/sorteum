'use client';

import { useAppLocale } from './locale-provider';

interface LocaleSwitcherProps {
  isScrolled?: boolean;
}

export function LocaleSwitcher({ isScrolled = false }: LocaleSwitcherProps) {
  const { locale, setLocale } = useAppLocale();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLocale('es')}
        className={`px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-md font-medium transition-colors ${
          locale === 'es'
            ? isScrolled
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/20 text-white backdrop-blur-sm'
            : isScrolled
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
              : 'text-white/70 hover:text-white'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-md font-medium transition-colors ${
          locale === 'en'
            ? isScrolled
              ? 'bg-primary text-primary-foreground'
              : 'bg-white/20 text-white backdrop-blur-sm'
            : isScrolled
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
              : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
