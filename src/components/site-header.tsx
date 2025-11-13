'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher'; // Importar el nuevo componente


export function SiteHeader() {
  const t = useTranslations('Index');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavLinks = () => (
    <>
      <Button asChild variant="ghost">
        <Link href="/#active-raffles" onClick={() => setIsMenuOpen(false)}>{t('activeRafflesLink')}</Link>
      </Button>
       <Button asChild variant="ghost">
        <Link href="/check-status" onClick={() => setIsMenuOpen(false)}>{t('CheckStatus.title')}</Link>
      </Button>
       <Button asChild variant="ghost">
        <Link href="/contact" onClick={() => setIsMenuOpen(false)}>{t('contactLink')}</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href="/login">{t('Admin.loginTitle')}</Link>
      </Button>
    </>
  );

  return (
    <header className={cn("sticky top-0 z-40 w-full transition-colors duration-300", 
        isScrolled ? "bg-background/80 backdrop-blur-sm border-b" : "bg-transparent text-white"
    )}>
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" aria-label="Go to homepage">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <NavLinks />
          <LocaleSwitcher /> {/* Usar el LocaleSwitcher */}
        </nav>
        <div className="md:hidden flex items-center gap-2">
            <LocaleSwitcher /> {/* Usar el LocaleSwitcher */}
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X/> : <Menu />}
                <span className="sr-only">Toggle Menu</span>
            </Button>
        </div>
      </div>
       {isMenuOpen && (
        <div className="md:hidden bg-background text-foreground border-t">
          <nav className="container flex flex-col py-4 gap-2">
            <NavLinks />
          </nav>
        </div>
      )}
    </header>
  );
}