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
    try {
        // Guard: ensure formData is provided and not empty. When called from forms,
        // `formData` should be a FormData instance with entries. If it's missing
        // or empty, return a clear error instead of throwing later.
        if (!formData) {
            return { message: 'Form data is missing.', success: false };
        }

        const entriesObj = Object.fromEntries(formData.entries());
        if (Object.keys(entriesObj).length === 0) {
            return { message: 'Form data is empty. Please fill out the form.', success: false };
        }
        const validatedFields = CreateRaffle.safeParse(entriesObj);

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
        console.log('Raffle Data:', raffleData);
        console.log('User Data:', userData);
        
        const newRaffle = await apiCreateRaffle({
            ...raffleData,
            deadline: new Date(raffleData.deadline).toISOString(),
            adminId: userData.user.id,
        });

        return { success: true, raffleId: newRaffle.id, message: 'Raffle created successfully!' };

    } catch (e: any) {
        let message = 'An unknown error occurred.';
        if (e instanceof Error) {
            message = e.message;
        } else if (typeof e === 'string') {
            message = e;
        } else if (e && typeof e.message === 'string') {
            message = e.message;
        }
        // FormData is not JSON-serializable directly; convert to a plain object
        // for safer debugging output.
        let formObj: Record<string, any> = {};
        try {
            formObj = Object.fromEntries(formData ? formData.entries() : []);
        } catch (_err) {
            // ignore conversion errors
        }

        const data = Object.fromEntries(formData.entries());
        return {
            message: `Database Error: ${message} DATA: ${JSON.stringify(data)}`,
            success: false,
        };
    }
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