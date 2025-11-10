import { RaffleCard } from '@/components/raffle-card';
import { getRaffles } from '@/lib/data';
import type { Raffle } from '@/lib/definitions';

export default function Home() {
  const raffles: Raffle[] = getRaffles();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 font-headline">
          Welcome to Sorteum Digital
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Your one-stop destination for exciting online raffles. Pick your lucky number!
        </p>
      </header>

      <section>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200 mb-8 font-headline">
          Active Raffles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {raffles
            .filter((raffle) => raffle.active)
            .map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
        </div>
      </section>
    </div>
  );
}
