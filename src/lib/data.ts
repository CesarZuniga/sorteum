import type { Raffle, Ticket } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

const generateTickets = (raffleId: string, count: number): Ticket[] => {
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    let status: 'available' | 'reserved' | 'paid' = 'available';
    let buyerName: string | undefined;
    let buyerPhone: string | undefined;

    if (Math.random() < 0.2) {
      status = 'paid';
      buyerName = `User ${number}`;
      buyerPhone = `555-01${String(number).padStart(2, '0')}`;
    } else if (Math.random() < 0.1) {
      status = 'reserved';
      buyerName = `User ${number}`;
      buyerPhone = `555-01${String(number).padStart(2, '0')}`;
    }

    return {
      id: `${raffleId}-ticket-${number}`,
      raffleId,
      number,
      status,
      buyerName,
      buyerPhone,
    };
  });
};

const raffles: Raffle[] = [
  {
    id: '1',
    name: 'Luxury Watch Raffle',
    description: 'Win a stunning, high-end luxury watch. A timeless piece for any collection.',
    image: PlaceHolderImages.find(img => img.id === 'raffle-watch')?.imageUrl || '',
    price: 25,
    ticketCount: 100,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    tickets: generateTickets('1', 100),
  },
  {
    id: '2',
    name: 'Next-Gen Smartphone Giveaway',
    description: 'Get your hands on the latest and greatest smartphone with cutting-edge features.',
    image: PlaceHolderImages.find(img => img.id === 'raffle-phone')?.imageUrl || '',
    price: 10,
    ticketCount: 200,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    tickets: generateTickets('2', 200),
  },
  {
    id: '3',
    name: 'Dream Vacation Package',
    description: 'A weekend getaway to a beautiful beach resort. All expenses paid!',
    image: PlaceHolderImages.find(img => img.id === 'raffle-vacation')?.imageUrl || '',
    price: 50,
    ticketCount: 50,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    tickets: generateTickets('3', 50),
  },
  {
    id: '4',
    name: 'Gaming Console Bundle',
    description: 'The ultimate gaming package including the latest console and popular games.',
    image: PlaceHolderImages.find(img => img.id === 'raffle-console')?.imageUrl || '',
    price: 15,
    ticketCount: 150,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    active: false,
    tickets: generateTickets('4', 150).map(t => ({ ...t, status: 'paid' })),
  },
];

export const getRaffles = (): Raffle[] => {
  return raffles;
};

export const getRaffleById = (id: string): Raffle | undefined => {
  return raffles.find((raffle) => raffle.id === id);
};

// In a real app, these would be database operations
export const updateTicketStatus = (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid',
  buyerInfo?: { name: string; email: string; phone: string }
) => {
  const raffle = getRaffleById(raffleId);
  if (raffle) {
    const ticket = raffle.tickets.find((t) => t.number === ticketNumber);
    if (ticket && ticket.status === 'available' || (ticket.status === 'reserved' && status === 'paid')) {
      ticket.status = status;
      if (buyerInfo) {
        ticket.buyerName = buyerInfo.name;
        ticket.buyerEmail = buyerInfo.email;
        ticket.buyerPhone = buyerInfo.phone;
        ticket.purchaseDate = new Date().toISOString();
      }
      return true;
    }
  }
  return false;
};
