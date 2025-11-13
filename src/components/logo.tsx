import { Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function Logo({ className }: { className?: string }) {
  const t = useTranslations('Logo');
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Ticket className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold tracking-tight font-headline">
        {t('name')}
      </span>
    </div>
  );
}