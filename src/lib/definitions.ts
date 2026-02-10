export type Ticket = {
  id: string;
  raffleId: string; // Corresponds to raffle_id in DB
  number: number; // Corresponds to ticket_number in DB
  status: 'available' | 'reserved' | 'paid' | 'winner';
  buyerName?: string; // Corresponds to purchaser_name in DB
  buyerEmail?: string; // Corresponds to purchaser_email in DB
  buyerPhone?: string; // Corresponds to purchaser_phone_number in DB
  purchaseDate?: string; // Corresponds to purchase_date in DB
  reservationExpiresAt?: string; // Corresponds to reservation_expires_at in DB
  isWinner?: boolean; // Corresponds to is_winner in DB
};

export type Raffle = {
  id: string;
  adminId: string; // Corresponds to admin_id in DB
  name: string;
  description: string;
  images: string[]; // Corresponds to image_url (TEXT[]) in DB
  price: number;
  ticketCount: number; // Corresponds to total_tickets in DB
  ticketsCreated: number; // Corresponds to tickets_created in DB
  deadline: string; // Corresponds to end_date in DB
  active: boolean; // Corresponds to is_active in DB
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  orderIndex: number; // Corresponds to order_index in DB
};

export type PaymentMethod = {
  id: string;
  bankName: string; // Corresponds to bank_name in DB
  accountNumber: string; // Corresponds to account_number in DB
  recipientName: string; // Corresponds to recipient_name in DB
  bankImageUrl?: string; // Corresponds to bank_image_url in DB
};

export type AppSettings = {
  id: string;
  reservationDurationMinutes: number;
  updatedAt: string;
};

export type TicketStatusFilter = 'available' | 'reserved' | 'paid' | 'winner' | 'all';

export type PaginatedTicketsResult = {
  tickets: Ticket[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TicketStatusCounts = {
  available: number;
  reserved: number;
  paid: number;
  winner: number;
  total: number;
};