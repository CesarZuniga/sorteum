import { Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Ticket className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold tracking-tight font-headline">
        Sorteum
      </span>
    </div>
  );
}
