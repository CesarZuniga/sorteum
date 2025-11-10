
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
  isWinner?: boolean;
};

export type Raffle = {
  id: string;
  adminId: string; // Keep adminId for ownership logic
  name: string;
  description: string;
  image: string;
  price: number;
  ticketCount: number;
  deadline: string; // ISO date string
  active: boolean;
  tickets?: Ticket[]; // Make optional as it's a subcollection
};
