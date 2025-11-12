'use server';

import type { Raffle, Ticket, FAQ } from './definitions';
import { createSupabaseServerClient } from '@/integrations/supabase/server'; // Import the server client
import { PlaceHolderImages } from './placeholder-images'; // Keep for initial image assignment

// --- Data Access Functions ---

// Helper to map Supabase raffle data to app Raffle type
const mapSupabaseRaffleToAppType = (dbRaffle: any): Raffle => ({
  id: dbRaffle.id,
  adminId: dbRaffle.admin_id,
  name: dbRaffle.name,
  description: dbRaffle.description,
  image: dbRaffle.image_url,
  price: parseFloat(dbRaffle.price), // Ensure price is a number
  ticketCount: dbRaffle.total_tickets,
  // Aseguramos que deadline siempre sea un string ISO
  deadline: dbRaffle.end_date ? new Date(dbRaffle.end_date).toISOString() : new Date().toISOString(),
  active: dbRaffle.is_active,
});

// Helper to map app Raffle type to Supabase raffle data
const mapAppRaffleToSupabaseType = (appRaffle: Omit<Raffle, 'id' | 'active'>): any => ({
  admin_id: appRaffle.adminId,
  name: appRaffle.name,
  description: appRaffle.description,
  image_url: appRaffle.image,
  price: appRaffle.price,
  total_tickets: appRaffle.ticketCount,
  end_date: appRaffle.deadline,
  is_active: new Date(appRaffle.deadline) > new Date(), // Determine active status based on deadline
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


// Raffles
export const getRaffles = async (): Promise<Raffle[]> => {
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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

  // Create initial tickets for the new raffle
  const newTicketsData = Array.from({ length: newRaffle.ticketCount }, (_, i) => ({
    raffle_id: newRaffle.id,
    ticket_number: i + 1,
    status: 'available',
  }));

  const { error: ticketsError } = await supabase
    .from('tickets')
    .insert(newTicketsData);

  if (ticketsError) {
    console.error('Supabase Error creating tickets for new raffle:', ticketsError);
    // Optionally, you might want to delete the created raffle here if ticket creation fails
    throw new Error(`Failed to create tickets for raffle: ${ticketsError.message || 'Unknown Supabase error'}`);
  }

  return newRaffle;
};

export const updateRaffle = async (id: string, raffleData: Partial<Omit<Raffle, 'id' | 'tickets' | 'active' | 'ticketCount'>>): Promise<Raffle | undefined> => {
  const supabase = await createSupabaseServerClient();
  const updatePayload: Partial<any> = {};
  if (raffleData.adminId !== undefined) updatePayload.admin_id = raffleData.adminId;
  if (raffleData.name !== undefined) updatePayload.name = raffleData.name;
  if (raffleData.description !== undefined) updatePayload.description = raffleData.description;
  if (raffleData.image !== undefined) updatePayload.image_url = raffleData.image;
  if (raffleData.price !== undefined) updatePayload.price = raffleData.price;
  if (raffleData.deadline !== undefined) {
    updatePayload.end_date = raffleData.deadline;
    updatePayload.is_active = new Date(raffleData.deadline) > new Date();
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
  const supabase = await createSupabaseServerClient();
  // RLS on tickets table ensures tickets are deleted via CASCADE
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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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
  } else {
    if (buyerInfo) {
      updatePayload.purchaser_name = buyerInfo.name;
      updatePayload.purchaser_email = buyerInfo.email;
      updatePayload.purchaser_phone_number = buyerInfo.phone;
    }
    if (status === 'paid') {
      updatePayload.purchase_date = new Date().toISOString();
      updatePayload.reservation_expires_at = null;
    }
    if (status === 'reserved') {
      const RESERVATION_DURATION_MINUTES = 15;
      updatePayload.purchase_date = null;
      updatePayload.reservation_expires_at = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();
    }
  }

  const { error } = await supabase
    .from('tickets')
    .update(updatePayload)
    .eq('raffle_id', raffleId)
    .eq('ticket_number', ticketNumber);

  if (error) {
    console.error(`Supabase Error updating ticket #${ticketNumber} for raffle ${raffleId}:`, error);
    throw new Error(`Failed to update ticket status: ${error.message || 'Unknown Supabase error'}`);
  }
  return true;
};

// FAQs
export const getFaqs = async (): Promise<FAQ[]> => {
  const supabase = await createSupabaseServerClient();
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