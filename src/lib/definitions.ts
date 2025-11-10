export type Ticket = {
  id: string;
  raffleId: string;
  number: number;
  status: 'available' | 'reserved' | 'paid';
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  purchaseDate?: string;
  reservationExpiresAt?: string;
};

export type Raffle = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  ticketCount: number;
  deadline: string; // ISO date string
  active: boolean;
  tickets: Ticket[];
};
