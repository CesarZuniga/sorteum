'use client';

import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, getRaffleById, getTicketsByRaffleId } from './data';
import { createSupabaseServerClient } from '@/integrations/supabase/server'; // Import the server client
import { toast } from '@/hooks/use-toast'; // Import toast for client-side notifications


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
        let errorMessage: string;
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        } else {
            // Fallback for any other type of error, ensuring it's a string
            try {
                errorMessage = JSON.stringify(e);
            } catch {
                errorMessage = String(e);
            }
        }
        
        return {
            message: `Database Error: ${errorMessage}`,
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
        let errorMessage: string;
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        } else {
            try {
                errorMessage = JSON.stringify(e);
            } catch {
                errorMessage = String(e);
            }
        }
        return { message: `Database Error: Failed to Update Raffle. ${errorMessage}`, success: false };
    }

    return { success: true, raffleId: id, message: 'Raffle updated successfully!' };
}


type DeleteRaffleState = {
    message?: string;
    success?: boolean;
};

export async function deleteRaffleAction(formData: FormData): Promise<void> { // Changed return type to Promise<void>
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid Raffle ID.', variant: 'destructive' });
    return;
  }
  
  const supabase = await createSupabaseServerClient(); // Use server client
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
      toast({ title: 'Error', description: 'Authentication Error: User not logged in.', variant: 'destructive' });
      return;
  }

  try {
    await apiDeleteRaffle(id);
    toast({ title: 'Success', description: 'Raffle deleted successfully.' });
  } catch (e: any) {
    let errorMessage: string;
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else {
        try {
            errorMessage = JSON.stringify(e);
        } catch {
            errorMessage = String(e);
        }
    }
    toast({ title: 'Error', description: `Database Error: Failed to Delete Raffle. ${errorMessage}`, variant: 'destructive' });
  }
}