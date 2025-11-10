import type { Raffle, Ticket } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

// Configuration for reservation time in minutes
const RESERVATION_DURATION_MINUTES = 15;

const checkExpiredReservations = (raffle: Raffle): Raffle => {
  const now = new Date();
  raffle.tickets.forEach(ticket => {
    if (ticket.status === 'reserved' && ticket.reservationExpiresAt) {
      const expirationDate = new Date(ticket.reservationExpiresAt);
      if (now > expirationDate) {
        ticket.status = 'available';
        ticket.buyerName = undefined;
        ticket.buyerEmail = undefined;
        ticket.buyerPhone = undefined;
        ticket.purchaseDate = undefined;
        ticket.reservationExpiresAt = undefined;
      }
    }
  });
  return raffle;
};


const generateTickets = (raffleId: string, count: number): Ticket[] => {
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    let status: 'available' | 'reserved' | 'paid' = 'available';
    let buyerName: string | undefined;
    let buyerPhone: string | undefined;

    // This is just for mock data generation, the actual reservation logic is handled elsewhere.
    if (Math.random() < 0.2) {
      status = 'paid';
      buyerName = `User ${number}`;
      buyerPhone = `555-01${String(number).padStart(2, '0')}`;
    } else if (Math.random() < 0.1) {
      // Don't set reserved status here, let the purchase flow handle it.
    }

    return {
      id: `${raffleId}-ticket-${number}`,
      raffleId,
      number,
      status,
      buyerName,
      buyerPhone,
      isWinner: false,
    };
  });
};

let raffles: Raffle[] = [
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
  // Before returning, check for expired reservations on all raffles
  raffles.forEach(checkExpiredReservations);
  return raffles;
};

export const getRaffleById = (id: string): Raffle | undefined => {
  let raffle = raffles.find((raffle) => raffle.id === id);
  if (raffle) {
    // Return a deep copy to avoid direct state mutation in components
    raffle = JSON.parse(JSON.stringify(raffle));
    return checkExpiredReservations(raffle);
  }
  return undefined;
};

export const createRaffle = (raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>): Raffle => {
    const newId = String(raffles.length + 1);
    const newRaffle: Raffle = {
        ...raffleData,
        id: newId,
        tickets: generateTickets(newId, raffleData.ticketCount),
        active: new Date(raffleData.deadline) > new Date(),
    };
    raffles.unshift(newRaffle);
    return newRaffle;
};

export const updateRaffle = (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Raffle | undefined => {
    const raffleIndex = raffles.findIndex(r => r.id === id);
    if (raffleIndex === -1) {
        return undefined;
    }
    const updatedRaffle = {
        ...raffles[raffleIndex],
        ...raffleData,
        active: new Date(raffleData.deadline || raffles[raffleIndex].deadline) > new Date(),
    };
    raffles[raffleIndex] = updatedRaffle;
    return updatedRaffle;
}


export const updateTicketStatus = (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
) => {
  const raffleIndex = raffles.findIndex(r => r.id === raffleId);
  if (raffleIndex === -1) return false;

  const ticketIndex = raffles[raffleIndex].tickets.findIndex(t => t.number === ticketNumber);
  if (ticketIndex === -1) return false;

  const ticket = raffles[raffleIndex].tickets[ticketIndex];
  
  if (status === 'winner') {
    ticket.isWinner = true;
    return true;
  }


  // Logic to update status
  ticket.status = status;

  if (status === 'available') {
    ticket.buyerName = undefined;
    ticket.buyerEmail = undefined;
    ticket.buyerPhone = undefined;
    ticket.purchaseDate = undefined;
    ticket.reservationExpiresAt = undefined;
    ticket.isWinner = false; // A ticket can't be available and a winner
  } else {
    if (buyerInfo) {
      ticket.buyerName = buyerInfo.name;
      ticket.buyerEmail = buyerInfo.email;
      ticket.buyerPhone = buyerInfo.phone;
    }
    if (status === 'paid') {
      ticket.purchaseDate = new Date().toISOString();
      ticket.reservationExpiresAt = undefined; // No expiration for paid tickets
    }
    if (status === 'reserved') {
      ticket.purchaseDate = undefined; // Not yet purchased
      ticket.reservationExpiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();
    }
  }

  return true;
};

export const deleteRaffle = (id: string): boolean => {
    const raffleIndex = raffles.findIndex(r => r.id === id);
    if (raffleIndex === -1) {
        return false;
    }
    raffles.splice(raffleIndex, 1);
    return true;
};
