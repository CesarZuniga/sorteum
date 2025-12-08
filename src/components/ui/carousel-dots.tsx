'use client';

import * as React from 'react';
import { useCarousel } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface CarouselDotsProps {
  className?: string;
}

export function CarouselDots({ className }: CarouselDotsProps) {
  const { scrollSnaps, selectedIndex, scrollTo } = useCarousel();

  if (!scrollSnaps || scrollSnaps.length <= 1) {
    return null; // No renderizar dots si no hay suficientes elementos para deslizar
  }

  return (
    <div className={cn('absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10', className)}>
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          className={cn(
            'h-2 w-2 rounded-full bg-gray-300 transition-colors duration-200',
            selectedIndex === index ? 'bg-primary' : 'hover:bg-gray-400'
          )}
          onClick={() => scrollTo(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}