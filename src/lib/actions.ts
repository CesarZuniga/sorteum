'use client';

import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, createFaq as apiCreateFaq, updateFaq as apiUpdateFaq, deleteFaq as apiDeleteFaq } from './data';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-utils'; // Import client-side supabase

const RaffleFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1'),
    deadline: z.string().min(1, 'Deadline is required'),
    // Change 'image' to 'imageUrls' and expect a string, then transform to array
    imageUrls: z.string().min(1, 'Image URL(s) are required').transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

const CreateRaffle = RaffleFormSchema.omit({ id: true }).extend({
    imageUrls: z.string().min(1, 'Image URL(s) are required'), // Keep as string for input validation
});
const UpdateRaffle = RaffleFormSchema.omit({ ticketCount: true }).extend({
    imageUrls: z.string().min(1, 'Image URL(s) are required'), // Keep as string for input validation
});

type RaffleActionState = {
    errors?: {
        name?: string[];
        description?: string[];
        price?: string[];
        ticketCount?: string[];
        deadline?: string[];
        imageUrls?: string[]; // Updated to imageUrls
    };
    message?: string;
    success?: boolean;
    raffleId?: string;
};

export async function createRaffleAction(prevState: RaffleActionState, formData: FormData): Promise<RaffleActionState> {
    try {
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

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            console.error('Authentication failed in createRaffleAction:', userError);
            return {
                message: 'Authentication Error: User not logged in.',
                success: false,
            };
        }

        const { imageUrls: imageUrlsString, ...restRaffleData } = validatedFields.data;
        const imageUrlsArray = imageUrlsString.split(',').map(s => s.trim()).filter(Boolean);
        
        const newRaffle = await apiCreateRaffle({
            ...restRaffleData,
            images: imageUrlsArray, // Pass as images array
            deadline: new Date(restRaffleData.deadline).toISOString(),
            adminId: userData.user.id, // Use the authenticated user's ID
        });

        return { success: true, raffleId: newRaffle.id, message: 'Raffle created successfully!' };

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        return {
            message: `Database Error: ${errorMessage}`,
            success: false,
            errors: undefined,
            raffleId: undefined,
        };
    }
}


export async function updateRaffleAction(prevState: RaffleActionState, formData: FormData): Promise<RaffleActionState> {
    const validatedFields = UpdateRaffle.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        deadline: formData.get('deadline'),
        imageUrls: formData.get('imageUrls'), // Updated to imageUrls
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update raffle. Please check the fields.',
            success: false,
        };
    }

    const { id, imageUrls: imageUrlsString, ...restDataToUpdate } = validatedFields.data;
    const imageUrlsArray = imageUrlsString.split(',').map(s => s.trim()).filter(Boolean);

    if (!id) {
        return { message: 'Raffle ID not found.', success: false };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return {
            message: 'Authentication Error: User not logged in.',
            success: false,
        };
    }

    try {
        await apiUpdateRaffle(id, {
            ...restDataToUpdate,
            images: imageUrlsArray, // Pass as images array
            deadline: new Date(restDataToUpdate.deadline).toISOString(),
            adminId: userData.user.id,
        });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { 
            message: `Database Error: Failed to Update Raffle. ${errorMessage}`, 
            success: false,
            errors: undefined,
            raffleId: undefined,
        };
    }

    return { success: true, raffleId: id, message: 'Raffle updated successfully!' };
}


export async function deleteRaffleAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid Raffle ID.', variant: 'destructive' });
    return;
  }
  
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
      toast({ title: 'Error', description: 'Authentication Error: User not logged in.', variant: 'destructive' });
      return;
  }

  try {
    await apiDeleteRaffle(id);
    toast({ title: 'Success', description: 'Raffle deleted successfully.' });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast({ title: 'Error', description: `Database Error: Failed to Delete Raffle. ${errorMessage}`, variant: 'destructive' });
  }
}

// --- FAQ Actions ---

const FaqFormSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    orderIndex: z.coerce.number().min(0, 'Order index must be a non-negative number'),
});

const CreateFaq = FaqFormSchema.omit({ id: true });
const UpdateFaq = FaqFormSchema;

type FaqActionState = {
    errors?: {
        question?: string[];
        answer?: string[];
        orderIndex?: string[];
    };
    message?: string;
    success?: boolean;
    faqId?: string;
};

export async function createFaqAction(prevState: FaqActionState, formData: FormData): Promise<FaqActionState> {
    try {
        const validatedFields = CreateFaq.safeParse(Object.fromEntries(formData.entries()));

        if (!validatedFields.success) {
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Failed to create FAQ. Please check the fields.',
                success: false,
            };
        }

        const newFaq = await apiCreateFaq(validatedFields.data);

        return { success: true, faqId: newFaq.id, message: 'FAQ created successfully!' };

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
            message: `Database Error: ${errorMessage}`,
            success: false,
            errors: undefined,
            faqId: undefined,
        };
    }
}

export async function updateFaqAction(prevState: FaqActionState, formData: FormData): Promise<FaqActionState> {
    const validatedFields = UpdateFaq.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update FAQ. Please check the fields.',
            success: false,
        };
    }

    const { id, ...dataToUpdate } = validatedFields.data;

    if (!id) {
        return { message: 'FAQ ID not found.', success: false };
    }

    try {
        await apiUpdateFaq(id, dataToUpdate);
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
            message: `Database Error: Failed to Update FAQ. ${errorMessage}`,
            success: false,
            errors: undefined,
            faqId: undefined,
        };
    }

    return { success: true, faqId: id, message: 'FAQ updated successfully!' };
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid FAQ ID.', variant: 'destructive' });
    return;
  }

  try {
    await apiDeleteFaq(id);
    toast({ title: 'Success', description: 'FAQ deleted successfully.' });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast({ title: 'Error', description: `Database Error: Failed to Delete FAQ. ${errorMessage}`, variant: 'destructive' });
  }
}