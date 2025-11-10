
'use server';

import type { Raffle, Ticket } from './definitions';
import { PlaceHolderImages } from './placeholder-images';

// --- Static Data Store ---

let raffles: Raffle[] = [
  {
    id: '1',
    name: 'Rifa de Reloj de Lujo',
    description: 'Participa para ganar un reloj exclusivo de alta gama. Un símbolo de elegancia y precisión.',
    image: PlaceHolderImages[0].imageUrl,
    price: 50,
    ticketCount: 100,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    active: true,
    adminId: 'admin-user-id',
  },
  {
    id: '2',
    name: 'Sorteo de Smartphone de Última Generación',
    description: 'No te pierdas la oportunidad de tener el último smartphone del mercado con tecnología de punta.',
    image: PlaceHolderImages[1].imageUrl,
    price: 20,
    ticketCount: 150,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    active: true,
    adminId: 'admin-user-id',
  },
   {
    id: '3',
    name: 'Vacaciones de Fin de Semana',
    description: 'Gana un paquete de viaje para dos personas a un destino paradisíaco. ¡Escápate de la rutina!',
    image: PlaceHolderImages[2].imageUrl,
    price: 30,
    ticketCount: 200,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    active: false,
    adminId: 'admin-user-id',
  },
];

let tickets: Ticket[] = raffles.flatMap(raffle => 
    Array.from({ length: raffle.ticketCount }, (_, i) => ({
        id: `${raffle.id}-${i + 1}`,
        raffleId: raffle.id,
        number: i + 1,
        status: 'available' as 'available' | 'reserved' | 'paid',
    }))
);

// Simulate some tickets being sold
tickets.forEach(ticket => {
    if (ticket.raffleId === '1' && Math.random() < 0.4) {
        ticket.status = 'paid';
        ticket.buyerName = 'Juan Pérez';
        ticket.buyerEmail = 'juan.perez@example.com';
        ticket.buyerPhone = '555-1234';
        ticket.purchaseDate = new Date().toISOString();
    }
    if (ticket.raffleId === '2' && Math.random() < 0.6) {
        ticket.status = 'paid';
        ticket.buyerName = 'Maria García';
        ticket.buyerEmail = 'maria.garcia@example.com';
        ticket.buyerPhone = '555-5678';
        ticket.purchaseDate = new Date().toISOString();
    }
    if (ticket.raffleId === '1' && ticket.number > 40 && ticket.number < 50) {
        ticket.status = 'reserved';
        ticket.buyerName = 'Carlos Lopez';
        ticket.buyerEmail = 'carlos.lopez@example.com';
        ticket.buyerPhone = '555-8765';
        ticket.reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
});


// --- Data Access Functions ---

// Raffles
export const getRaffles = async (): Promise<Raffle[]> => {
  console.log("Getting all raffles (static)");
  return Promise.resolve(JSON.parse(JSON.stringify(raffles)));
};

export const getRaffleById = async (id: string): Promise<Raffle | undefined> => {
  console.log(`Getting raffle by ID: ${id} (static)`);
  const raffle = raffles.find((r) => r.id === id);
  return Promise.resolve(raffle ? JSON.parse(JSON.stringify(raffle)) : undefined);
};

export const createRaffle = async (raffleData: Omit<Raffle, 'id' | 'tickets' | 'active'>): Promise<Raffle> => {
  const newId = String(Date.now());
  const newRaffle: Raffle = {
    ...raffleData,
    id: newId,
    active: new Date(raffleData.deadline) > new Date(),
    tickets: [], // tickets are managed in the global tickets array
  };
  
  raffles.push(newRaffle);
  
  const newTickets: Ticket[] = Array.from({ length: raffleData.ticketCount }, (_, i) => ({
    id: `${newId}-${i + 1}`,
    raffleId: newId,
    number: i + 1,
    status: 'available',
  }));
  tickets.push(...newTickets);
  
  console.log(`Created raffle: ${newRaffle.name} (static)`);
  return Promise.resolve(JSON.parse(JSON.stringify(newRaffle)));
};

export const updateRaffle = async (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Promise<Raffle | undefined> => {
    const raffleIndex = raffles.findIndex(r => r.id === id);
    if (raffleIndex === -1) {
        return Promise.resolve(undefined);
    }
    
    raffles[raffleIndex] = { ...raffles[raffleIndex], ...raffleData };
    console.log(`Updated raffle: ${id} (static)`);
    return Promise.resolve(JSON.parse(JSON.stringify(raffles[raffleIndex])));
};

export const deleteRaffle = async (id: string): Promise<boolean> => {
  const raffleIndex = raffles.findIndex(r => r.id === id);
  if (raffleIndex > -1) {
    raffles.splice(raffleIndex, 1);
    tickets = tickets.filter(t => t.raffleId !== id);
    console.log(`Deleted raffle: ${id} (static)`);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
};

// Tickets
export const getTicketsByRaffleId = async (raffleId: string): Promise<Ticket[]> => {
    console.log(`Getting tickets for raffle: ${raffleId} (static)`);
    const raffleTickets = tickets.filter(t => t.raffleId === raffleId);
    return Promise.resolve(JSON.parse(JSON.stringify(raffleTickets)));
};

export const getTicketByNumber = async (raffleId: string, ticketNumber: number): Promise<Ticket | undefined> => {
    console.log(`Getting ticket #${ticketNumber} for raffle: ${raffleId} (static)`);
    const ticket = tickets.find(t => t.raffleId === raffleId && t.number === ticketNumber);
    return Promise.resolve(ticket ? JSON.parse(JSON.stringify(ticket)) : undefined);
}

export const updateTicketStatus = async (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): Promise<boolean> => {
  const ticketIndex = tickets.findIndex(t => t.raffleId === raffleId && t.number === ticketNumber);
  if (ticketIndex === -1) {
    return Promise.resolve(false);
  }

  const ticket = tickets[ticketIndex];
  
  if (status === 'winner') {
      ticket.isWinner = true;
  } else if (status === 'available') {
      ticket.status = 'available';
      ticket.buyerName = undefined;
      ticket.buyerEmail = undefined;
      ticket.buyerPhone = undefined;
      ticket.purchaseDate = undefined;
      ticket.reservationExpiresAt = undefined;
      ticket.isWinner = false;
  } else {
      ticket.status = status;
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
          const RESERVATION_DURATION_MINUTES = 15;
          ticket.purchaseDate = undefined;
          ticket.reservationExpiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();
      }
  }

  tickets[ticketIndex] = ticket;
  console.log(`Updated ticket #${ticketNumber} for raffle ${raffleId} to status: ${status} (static)`);
  return Promise.resolve(true);
};
