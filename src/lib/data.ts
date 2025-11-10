
import type { Raffle, Ticket } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

// In-memory data store
let raffles: Raffle[] = [
  {
    id: '1',
    name: 'Luxury Watch Raffle',
    description: 'Win a brand new luxury watch worth over $5000.',
    image: PlaceHolderImages[0].imageUrl,
    price: 50,
    ticketCount: 100,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    tickets: [],
  },
  {
    id: '2',
    name: 'New Smartphone Giveaway',
    description: 'Get your hands on the latest smartphone model.',
    image: PlaceHolderImages[1].imageUrl,
    price: 10,
    ticketCount: 200,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    tickets: [],
  },
  {
    id: '3',
    name: 'Vacation Package Draw',
    description: 'A weekend getaway for two to a surprise destination.',
    image: PlaceHolderImages[2].imageUrl,
    price: 25,
    ticketCount: 150,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    active: false,
    tickets: [],
  },
];

// Function to initialize tickets for all raffles
const initializeTickets = () => {
  raffles.forEach(raffle => {
    if (raffle.tickets.length === 0) {
      raffle.tickets = Array.from({ length: raffle.ticketCount }, (_, i) => {
        const ticketNumber = i + 1;
        // Simulate some tickets being sold
        const isSold = Math.random() > 0.8;
        return {
          id: `${raffle.id}-${ticketNumber}`,
          raffleId: raffle.id,
          number: ticketNumber,
          status: isSold ? 'paid' : 'available',
          buyerName: isSold ? `User ${ticketNumber}` : undefined,
          buyerEmail: isSold ? `user${ticketNumber}@example.com` : undefined,
          buyerPhone: isSold ? '555-555-5555' : undefined,
        };
      });
    }
  });
};

initializeTickets();

// Configuration for reservation time in minutes
const RESERVATION_DURATION_MINUTES = 15;

export const getRaffles = (): Raffle[] => {
  // Update active status based on current date
  raffles.forEach(raffle => {
    raffle.active = new Date(raffle.deadline) > new Date();
  });
  return raffles;
};

export const getRaffleById = (id: string): Raffle | undefined => {
  const raffle = raffles.find(r => r.id === id);
  if (raffle) {
    raffle.active = new Date(raffle.deadline) > new Date();
  }
  return raffle;
};

export const createRaffle = (raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>): Raffle => {
  const newRaffle: Raffle = {
    ...raffleData,
    id: String(Date.now()),
    active: new Date(raffleData.deadline) > new Date(),
    tickets: Array.from({ length: raffleData.ticketCount }, (_, i) => ({
        id: `${Date.now()}-${i + 1}`,
        raffleId: String(Date.now()),
        number: i + 1,
        status: 'available',
    })),
  };
  raffles.push(newRaffle);
  return newRaffle;
};

export const updateRaffle = (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Raffle | undefined => {
  const raffleIndex = raffles.findIndex(r => r.id === id);
  if (raffleIndex === -1) return undefined;
  
  raffles[raffleIndex] = { ...raffles[raffleIndex], ...raffleData };
  return raffles[raffleIndex];
};

export const updateTicketStatus = (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): boolean => {
  const raffle = getRaffleById(raffleId);
  if (!raffle) return false;

  const ticket = raffle.tickets.find(t => t.number === ticketNumber);
  if (!ticket) return false;

  ticket.status = status as 'available' | 'reserved' | 'paid';

  if (status === 'winner') {
      ticket.isWinner = true;
  } else if (status === 'available') {
      ticket.buyerName = undefined;
      ticket.buyerEmail = undefined;
      ticket.buyerPhone = undefined;
      ticket.purchaseDate = undefined;
      ticket.reservationExpiresAt = undefined;
      ticket.isWinner = false;
  } else {
      if (buyerInfo) {
          ticket.buyerName = buyerInfo.name;
          ticket.buyerEmail = buyerInfo.email;
          ticket.buyerPhone = buyerInfo.phone;
      }
      if (status === 'paid') {
          ticket.purchaseDate = new Date().toISOString();
          ticket.reservationExpiresAt = undefined;
      }
      if (status === 'reserved') {
          ticket.purchaseDate = undefined;
          ticket.reservationExpiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();
      }
  }

  return true;
};

export const deleteRaffle = (id: string): boolean => {
    const initialLength = raffles.length;
    raffles = raffles.filter(r => r.id !== id);
    return raffles.length < initialLength;
};
