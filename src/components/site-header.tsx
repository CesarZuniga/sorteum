import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Go to homepage">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/login">Admin Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
