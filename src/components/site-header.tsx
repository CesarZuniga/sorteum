'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';


export function SiteHeader() {
  const t = useTranslations('Index');
  const tCheckStatus = useTranslations('CheckStatus');
  const tAdmin = useTranslations('Admin');
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
      <Button asChild variant="ghost" className={cn(
        "transition-colors",
        isScrolled ? "hover:bg-accent" : "hover:bg-white/10"
      )}>
        <Link href="/#active-raffles" onClick={() => setIsMenuOpen(false)}>
          <span>{t('activeRafflesLink')}</span>
        </Link>
      </Button>
       <Button asChild variant="ghost" className={cn(
        "transition-colors",
        isScrolled ? "hover:bg-accent" : "hover:bg-white/10"
      )}>
        <Link href="/check-status" onClick={() => setIsMenuOpen(false)}>
          <span>{tCheckStatus('title')}</span>
        </Link>
      </Button>
       <Button asChild variant="ghost" className={cn(
        "transition-colors",
        isScrolled ? "hover:bg-accent" : "hover:bg-white/10"
      )}>
        <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
          <span>{t('contactLink')}</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" className={cn(
        "transition-colors",
        isScrolled ? "hover:bg-accent" : "hover:bg-white/10"
      )}>
        <Link href="/login">
          <span>{tAdmin('loginTitle')}</span>
        </Link>
      </Button>
    </>
  );

  return (
    <header className={cn("sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled ? "glass" : "bg-transparent text-white"
    )}>
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" aria-label="Go to homepage">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <NavLinks />
          <LocaleSwitcher isScrolled={isScrolled} />
        </nav>
        <div className="md:hidden flex items-center gap-2">
            <LocaleSwitcher isScrolled={isScrolled} />
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
