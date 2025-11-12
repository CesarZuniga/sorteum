'use client';

import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, getRaffleById, getTicketsByRaffleId } from './data';
import { createSupabaseServerClient } from '@/integrations/supabase/server'; // Import the server client


// Removed drawWinnerAction and notifyWinnersAction as they depend on Genkit AI.

const FormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1'),
    deadline: z.string().min(1, 'Deadline is required'),
    image: z.string().url('Must be a valid image URL'),
});

const CreateRaffle = FormSchema.omit({ id: true });
const UpdateRaffle = FormSchema.omit({ ticketCount: true });


type CreateRaffleState = {
    errors?: {
        name?: string[];
        description?: string[];
        price?: string[];
        ticketCount?: string[];
        deadline?: string[];
        image?: string[];
    };
    message?: string;
    success?: boolean;
    raffleId?: string;
};

export async function createRaffleAction(prevState: CreateRaffleState, formData: FormData): Promise<CreateRaffleState> {
     const validatedFields = CreateRaffle.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        ticketCount: formData.get('ticketCount'),
        deadline: formData.get('deadline'),
        image: formData.get('image'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to create raffle. Please check the fields.',
            success: false,
        };
    }
    
    const supabase = await createSupabaseServerClient(); // Use server client
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error('Authentication failed in createRaffleAction:', userError);
        return {
            message: 'Authentication Error: User not logged in.',
            success: false,
        };
    }

    const raffleData = validatedFields.data;
    let newRaffleId: string | undefined;

    try {
        const newRaffle = await apiCreateRaffle({
            ...raffleData,
            deadline: new Date(raffleData.deadline).toISOString(),
            adminId: userData.user.id,
        });
        newRaffleId = newRaffle.id;
    } catch (e: any) {
        return {
            message: `Database Error: Failed to Create Raffle. ${e.message}`,
            success: false,
        };
    }

    return { success: true, raffleId: newRaffleId, message: 'Raffle created successfully!' };
}


export async function updateRaffleAction(prevState: CreateRaffleState, formData: FormData): Promise<CreateRaffleState> {
    const validatedFields = UpdateRaffle.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        deadline: formData.get('deadline'),
        image: formData.get('image'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update raffle. Please check the fields.',
            success: false,
        };
    }

    const { id, ...dataToUpdate } = validatedFields.data;

    if (!id) {
        return { message: 'Raffle ID not found.', success: false };
    }

    const supabase = await createSupabaseServerClient(); // Use server client
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return {
            message: 'Authentication Error: User not logged in.',
            success: false,
        };
    }

    try {
        await apiUpdateRaffle(id, {
            ...dataToUpdate,
            deadline: new Date(dataToUpdate.deadline).toISOString(),
            adminId: userData.user.id,
        });
    } catch (e: any) {
        return { message: `Database Error: Failed to Update Raffle. ${e.message}`, success: false };
    }

    return { success: true, raffleId: id, message: 'Raffle updated successfully!' };
}


type DeleteRaffleState = {
    message?: string;
    success?: boolean;
};

export async function deleteRaffleAction(formData: FormData): Promise<DeleteRaffleState> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    return { message: 'Invalid Raffle ID.', success: false };
  }
  
  const supabase = await createSupabaseServerClient(); // Use server client
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
      return { message: 'Authentication Error: User not logged in.', success: false };
  }

  try {
    await apiDeleteRaffle(id);
  } catch (e: any) {
    return { message: `Database Error: Failed to Delete Raffle. ${e.message}`, success: false };
  }

  return { success: true, message: 'Raffle deleted successfully.' };
}