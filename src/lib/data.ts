'use client'; // Mark this file as a client component

import type { Raffle, Ticket, FAQ, PaymentMethod, PaginatedTicketsResult, TicketStatusCounts, TicketStatusFilter, AppSettings } from './definitions';
import { supabase } from '@/integrations/supabase/client-utils'; // Import the client-side Supabase instance
import { PlaceHolderImages } from './placeholder-images'; // Keep for initial image assignment
import { z } from 'zod';

// --- Buyer info validation schema ---
const BuyerInfoSchema = z.object({
  name: z.string().min(1).max(200).regex(/^[^<>"'&]*$/, 'Name contains invalid characters'),
  email: z.string().email('Invalid email format').max(254),
  phone: z.string().min(7).max(20).regex(/^[+\d\s()-]+$/, 'Invalid phone number format'),
});

// --- Auth helper for admin-only operations (defense-in-depth, RLS is primary) ---
const requireAuthForMutation = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Authentication required');
  }
  return user;
};

// --- Data Access Functions ---

// Helper to map Supabase raffle data to app Raffle type
const mapSupabaseRaffleToAppType = (dbRaffle: any): Raffle => ({
  id: dbRaffle.id,
  adminId: dbRaffle.admin_id,
  name: dbRaffle.name,
  description: dbRaffle.description,
  images: dbRaffle.image_url || [],
  price: parseFloat(dbRaffle.price),
  ticketCount: dbRaffle.total_tickets,
  ticketsCreated: dbRaffle.tickets_created ?? 0,
  deadline: dbRaffle.end_date ? new Date(dbRaffle.end_date).toISOString() : new Date().toISOString(),
  active: dbRaffle.is_active,
});

// Helper to map app Raffle type to Supabase raffle data
const mapAppRaffleToSupabaseType = (appRaffle: Omit<Raffle, 'id' | 'active'>): any => ({
  admin_id: appRaffle.adminId,
  name: appRaffle.name,
  description: appRaffle.description,
  image_url: appRaffle.images,
  price: appRaffle.price,
  total_tickets: appRaffle.ticketCount,
  tickets_created: 0,
  end_date: appRaffle.deadline,
  is_active: false, // Starts inactive; pg_cron activates after tickets are created
});

// Helper to map Supabase ticket data to app Ticket type
const mapSupabaseTicketToAppType = (dbTicket: any): Ticket => ({
  id: dbTicket.id,
  raffleId: dbTicket.raffle_id,
  number: dbTicket.ticket_number,
  status: dbTicket.status,
  buyerName: dbTicket.purchaser_name,
  buyerEmail: dbTicket.purchaser_email,
  buyerPhone: dbTicket.purchaser_phone_number,
  // Aseguramos que purchaseDate y reservationExpiresAt siempre sean strings ISO o undefined
  purchaseDate: dbTicket.purchase_date ? new Date(dbTicket.purchase_date).toISOString() : undefined,
  reservationExpiresAt: dbTicket.reservation_expires_at ? new Date(dbTicket.reservation_expires_at).toISOString() : undefined,
  isWinner: dbTicket.is_winner,
});

// Helper to map Supabase FAQ data to app FAQ type
const mapSupabaseFaqToAppType = (dbFaq: any): FAQ => ({
  id: dbFaq.id,
  question: dbFaq.question,
  answer: dbFaq.answer,
  orderIndex: dbFaq.order_index,
});

// Helper to map Supabase payment method data to app PaymentMethod type
const mapSupabasePaymentMethodToAppType = (dbPaymentMethod: any): PaymentMethod => ({
  id: dbPaymentMethod.id,
  bankName: dbPaymentMethod.bank_name,
  accountNumber: dbPaymentMethod.account_number,
  recipientName: dbPaymentMethod.recipient_name,
  bankImageUrl: dbPaymentMethod.bank_image_url,
});


// Raffles
export const getRaffles = async (): Promise<Raffle[]> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error fetching raffles:', error);
    throw new Error(`Failed to fetch raffles: ${error.message || 'Unknown Supabase error'}`);
  }
  return data.map(mapSupabaseRaffleToAppType);
};

export const getRaffleById = async (id: string): Promise<Raffle | undefined> => {
  const { data, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error(`Supabase Error fetching raffle by ID ${id}:`, error);
    throw new Error(`Failed to fetch raffle with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }

  return data ? mapSupabaseRaffleToAppType(data) : undefined;
};

export const createRaffle = async (raffleData: Omit<Raffle, 'id' | 'active'>): Promise<Raffle> => {
  await requireAuthForMutation();
  const supabaseData = mapAppRaffleToSupabaseType(raffleData);
  const { data, error } = await supabase
    .from('raffles')
    .insert([supabaseData]) // Pasamos el objeto directamente, no como string JSON
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error creating raffle:', error);
    throw new Error(`Failed to create raffle: ${error.message || 'Unknown Supabase error'}`);
  }

  const newRaffle = mapSupabaseRaffleToAppType(data);

  // Tickets are created asynchronously by pg_cron job (process_pending_raffle_tickets)
  // The raffle starts as inactive and will be activated once all tickets are created

  return newRaffle;
};

export const updateRaffle = async (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Promise<Raffle | undefined> => {
  await requireAuthForMutation();
  const updatePayload: Partial<any> = {};
  if (raffleData.adminId !== undefined) updatePayload.admin_id = raffleData.adminId;
  if (raffleData.name !== undefined) updatePayload.name = raffleData.name;
  if (raffleData.description !== undefined) updatePayload.description = raffleData.description;
  if (raffleData.images !== undefined) updatePayload.image_url = raffleData.images; // Now expects an array
  if (raffleData.price !== undefined) updatePayload.price = raffleData.price;
  if (raffleData.deadline !== undefined) {
    updatePayload.end_date = raffleData.deadline;
    // is_active is managed by pg_cron: only active when tickets are ready AND deadline not passed
    // If deadline is in the past, force inactive; otherwise leave for pg_cron to manage
    if (new Date(raffleData.deadline) <= new Date()) {
      updatePayload.is_active = false;
    }
  }

  const { data, error } = await supabase
    .from('raffles')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase Error updating raffle ${id}:`, error);
    throw new Error(`Failed to update raffle with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }

  return data ? mapSupabaseRaffleToAppType(data) : undefined;
};

export const deleteRaffle = async (id: string): Promise<boolean> => {
  await requireAuthForMutation();
  const { error } = await supabase
    .from('raffles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase Error deleting raffle ${id}:`, error);
    throw new Error(`Failed to delete raffle with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return true;
};

// Tickets
export const getTicketsByRaffleId = async (raffleId: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId)
    .order('ticket_number', { ascending: true });

  if (error) {
    console.error(`Supabase Error fetching tickets for raffle ${raffleId}:`, error);
    throw new Error(`Failed to fetch tickets for raffle with ID ${raffleId}: ${error.message || 'Unknown Supabase error'}`);
  }
  return data.map(mapSupabaseTicketToAppType);
};

export const getTicketByNumber = async (raffleId: string, ticketNumber: number): Promise<Ticket | undefined> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId)
    .eq('ticket_number', ticketNumber)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error(`Supabase Error fetching ticket #${ticketNumber} for raffle ${raffleId}:`, error);
    throw new Error(`Failed to fetch ticket #${ticketNumber} for raffle with ID ${raffleId}: ${error.message || 'Unknown Supabase error'}`);
  }

  return data ? mapSupabaseTicketToAppType(data) : undefined;
};

export const updateTicketStatus = async (
  raffleId: string,
  ticketNumber: number,
  status: 'reserved' | 'paid' | 'available' | 'winner',
  buyerInfo?: { name: string; email: string; phone: string }
): Promise<boolean> => {
  // Only 'reserved' is allowed for anonymous users; all other status changes require auth
  if (status !== 'reserved') {
    await requireAuthForMutation();
  }

  // Validate buyer info server-side when provided
  if (buyerInfo && (status === 'reserved' || status === 'paid')) {
    const parsed = BuyerInfoSchema.safeParse(buyerInfo);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || 'Invalid buyer information';
      throw new Error(firstError);
    }
    buyerInfo = parsed.data;
  }

  const updatePayload: Partial<any> = { status };

  if (status === 'winner') {
    updatePayload.is_winner = true;
  } else if (status === 'available') {
    updatePayload.purchaser_name = null;
    updatePayload.purchaser_email = null;
    updatePayload.purchaser_phone_number = null;
    updatePayload.purchase_date = null;
    updatePayload.reservation_expires_at = null;
    updatePayload.is_winner = false;
  } else { // This 'else' block covers 'reserved' and 'paid'
    if (buyerInfo) {
      updatePayload.purchaser_name = buyerInfo.name;
      updatePayload.purchaser_email = buyerInfo.email;
      updatePayload.purchaser_phone_number = buyerInfo.phone;
    }
    if (status === 'paid') {
      updatePayload.purchase_date = new Date().toISOString();
      updatePayload.reservation_expires_at = null;
      updatePayload.is_winner = false; // Explicitly set is_winner to false when status is paid
    }
    if (status === 'reserved') {
      const settings = await getSettings();
      const durationMinutes = settings.reservationDurationMinutes;
      updatePayload.purchase_date = null;
      updatePayload.reservation_expires_at = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    }
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updatePayload)
    .eq('raffle_id', raffleId)
    .eq('ticket_number', ticketNumber)
    .select('id');

  if (error) {
    console.error(`Supabase Error updating ticket #${ticketNumber} for raffle ${raffleId}:`, error);
    throw new Error(`Failed to update ticket status: ${error.message || 'Unknown Supabase error'}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Ticket #${ticketNumber} could not be updated. It may have already been reserved by someone else.`);
  }

  return true;
};

// --- Paginated Tickets ---

export const getPaginatedTickets = async (
  raffleId: string,
  options: {
    page?: number;
    pageSize?: number;
    statusFilter?: TicketStatusFilter;
  } = {}
): Promise<PaginatedTicketsResult> => {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, options.pageSize ?? 50));
  const statusFilter = options.statusFilter ?? 'all';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .eq('raffle_id', raffleId);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error, count } = await query
    .order('ticket_number', { ascending: true })
    .range(from, to);

  if (error) {
    console.error(`Supabase Error fetching paginated tickets for raffle ${raffleId}:`, error);
    throw new Error(`Failed to fetch tickets: ${error.message || 'Unknown Supabase error'}`);
  }

  const totalCount = count ?? 0;

  return {
    tickets: (data ?? []).map(mapSupabaseTicketToAppType),
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
};

export const getTicketStatusCounts = async (raffleId: string): Promise<TicketStatusCounts> => {
  const statuses = ['available', 'reserved', 'paid', 'winner'] as const;

  const countPromises = statuses.map(async (status) => {
    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('raffle_id', raffleId)
      .eq('status', status);

    if (error) {
      console.error(`Error counting ${status} tickets:`, error);
      return { status, count: 0 };
    }
    return { status, count: count ?? 0 };
  });

  const results = await Promise.all(countPromises);

  const counts: TicketStatusCounts = {
    available: 0,
    reserved: 0,
    paid: 0,
    winner: 0,
    total: 0,
  };

  for (const { status, count } of results) {
    counts[status] = count;
    counts.total += count;
  }

  return counts;
};

export const drawWinnersServerSide = async (
  raffleId: string,
  winnerCount: number
): Promise<Ticket[]> => {
  await requireAuthForMutation();
  const { data, error } = await supabase
    .rpc('draw_random_winners', {
      p_raffle_id: raffleId,
      p_winner_count: winnerCount,
    });

  if (error) {
    console.error('Error drawing winners via RPC:', error);
    throw new Error(`Failed to draw winners: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No eligible tickets found for drawing.');
  }

  return data.map(mapSupabaseTicketToAppType);
};

export const getRandomAvailableTickets = async (
  raffleId: string,
  count: number,
  excludeNumbers: number[] = []
): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .rpc('get_random_available_tickets', {
      p_raffle_id: raffleId,
      p_count: count,
      p_exclude_numbers: excludeNumbers,
    });

  if (error) {
    console.error('Error fetching random available tickets:', error);
    throw new Error(`Failed to get random tickets: ${error.message}`);
  }

  return (data ?? []).map(mapSupabaseTicketToAppType);
};

// Settings
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error) {
      console.error('Supabase Error fetching settings:', error);
      return { id: '', reservationDurationMinutes: 15, updatedAt: new Date().toISOString() };
    }

    return {
      id: data.id,
      reservationDurationMinutes: data.reservation_duration_minutes,
      updatedAt: data.updated_at,
    };
  } catch {
    return { id: '', reservationDurationMinutes: 15, updatedAt: new Date().toISOString() };
  }
};

export const updateSettings = async (settings: { reservationDurationMinutes: number }): Promise<AppSettings> => {
  await requireAuthForMutation();
  const { data: current } = await supabase.from('settings').select('id').single();
  if (!current) throw new Error('Settings row not found');

  const { data, error } = await supabase
    .from('settings')
    .update({
      reservation_duration_minutes: settings.reservationDurationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error updating settings:', error);
    throw new Error('Failed to update settings');
  }

  return {
    id: data.id,
    reservationDurationMinutes: data.reservation_duration_minutes,
    updatedAt: data.updated_at,
  };
};

// FAQs
export const getFaqs = async (): Promise<FAQ[]> => {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Supabase Error fetching FAQs:', error);
    throw new Error(`Failed to fetch FAQs: ${error.message || 'Unknown Supabase error'}`);
  }
  return data.map(mapSupabaseFaqToAppType);
};

export const getFaqById = async (id: string): Promise<FAQ | undefined> => {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error(`Supabase Error fetching FAQ by ID ${id}:`, error);
    throw new Error(`Failed to fetch FAQ with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }

  return data ? mapSupabaseFaqToAppType(data) : undefined;
};

export const createFaq = async (faqData: Omit<FAQ, 'id'>): Promise<FAQ> => {
  await requireAuthForMutation();
  const { data, error } = await supabase
    .from('faqs')
    .insert([{
      question: faqData.question,
      answer: faqData.answer,
      order_index: faqData.orderIndex,
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error creating FAQ:', error);
    throw new Error(`Failed to create FAQ: ${error.message || 'Unknown Supabase error'}`);
  }
  return mapSupabaseFaqToAppType(data);
};

export const updateFaq = async (id: string, faqData: Partial<Omit<FAQ, 'id'>>): Promise<FAQ | undefined> => {
  await requireAuthForMutation();
  const updatePayload: Partial<any> = {};
  if (faqData.question !== undefined) updatePayload.question = faqData.question;
  if (faqData.answer !== undefined) updatePayload.answer = faqData.answer;
  if (faqData.orderIndex !== undefined) updatePayload.order_index = faqData.orderIndex;

  const { data, error } = await supabase
    .from('faqs')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase Error updating FAQ ${id}:`, error);
    throw new Error(`Failed to update FAQ with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return data ? mapSupabaseFaqToAppType(data) : undefined;
};

export const deleteFaq = async (id: string): Promise<boolean> => {
  await requireAuthForMutation();
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase Error deleting FAQ ${id}:`, error);
    throw new Error(`Failed to delete FAQ with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return true;
};

// Payment Methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('bank_name', { ascending: true });

  if (error) {
    console.error('Supabase Error fetching payment methods:', error);
    throw new Error(`Failed to fetch payment methods: ${error.message || 'Unknown Supabase error'}`);
  }
  return data.map(mapSupabasePaymentMethodToAppType);
};

export const getPaymentMethodById = async (id: string): Promise<PaymentMethod | undefined> => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Supabase Error fetching payment method by ID ${id}:`, error);
    throw new Error(`Failed to fetch payment method with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return data ? mapSupabasePaymentMethodToAppType(data) : undefined;
};

export const createPaymentMethod = async (paymentMethodData: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  await requireAuthForMutation();
  const { data, error } = await supabase
    .from('payment_methods')
    .insert([{
      bank_name: paymentMethodData.bankName,
      account_number: paymentMethodData.accountNumber,
      recipient_name: paymentMethodData.recipientName,
      bank_image_url: paymentMethodData.bankImageUrl,
    }])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase Error creating payment method:', error);
    throw new Error(`Failed to create payment method: ${error.message || 'Unknown Supabase error'}`);
  }
  return mapSupabasePaymentMethodToAppType(data);
};

export const updatePaymentMethod = async (id: string, paymentMethodData: Partial<Omit<PaymentMethod, 'id'>>): Promise<PaymentMethod | undefined> => {
  await requireAuthForMutation();
  const updatePayload: Partial<any> = {};
  if (paymentMethodData.bankName !== undefined) updatePayload.bank_name = paymentMethodData.bankName;
  if (paymentMethodData.accountNumber !== undefined) updatePayload.account_number = paymentMethodData.accountNumber;
  if (paymentMethodData.recipientName !== undefined) updatePayload.recipient_name = paymentMethodData.recipientName;
  if (paymentMethodData.bankImageUrl !== undefined) updatePayload.bank_image_url = paymentMethodData.bankImageUrl;

  const { data, error } = await supabase
    .from('payment_methods')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`Supabase Error updating payment method ${id}:`, error);
    throw new Error(`Failed to update payment method with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return data ? mapSupabasePaymentMethodToAppType(data) : undefined;
};

export const deletePaymentMethod = async (id: string): Promise<boolean> => {
  await requireAuthForMutation();
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase Error deleting payment method ${id}:`, error);
    throw new Error(`Failed to delete payment method with ID ${id}: ${error.message || 'Unknown Supabase error'}`);
  }
  return true;
};