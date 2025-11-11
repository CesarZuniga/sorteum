'use server';

import { chooseLotteryWinners, ChooseLotteryWinnersInput, ChooseLotteryWinnersOutput } from '@/ai/flows/choose-lottery-winners-with-gen-ai';
import { sendLotteryResults, SendLotteryResultsInput } from '@/ai/flows/automated-lottery-result-notifications';
import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, getRaffleById, getTicketsByRaffleId } from './data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/integrations/supabase/server'; // Import the server client

const drawWinnerSchema = z.object({
  raffleId: z.string(),
  criteria: z.string().min(10, 'Please provide more detailed criteria.'),
  winnerCount: z.coerce.number().min(1),
});

type DrawWinnerState = {
  result?: ChooseLotteryWinnersOutput;
  error?: string;
  success: boolean;
};

export async function drawWinnerAction(
  prevState: DrawWinnerState,
  formData: FormData
): Promise<DrawWinnerState> {
  try {
    const validatedFields = drawWinnerSchema.safeParse({
      raffleId: formData.get('raffleId'),
      criteria: formData.get('criteria'),
      winnerCount: Number(formData.get('winnerCount')),
    });

    if (!validatedFields.success) {
      return { success: false, error: 'Invalid form data.' };
    }

    const { raffleId, criteria, winnerCount } = validatedFields.data;
    const raffle = await getRaffleById(raffleId);

    if (!raffle) {
      return { success: false, error: 'Raffle not found.' };
    }

    const tickets = await getTicketsByRaffleId(raffleId);
    const ticketNumbers = tickets.map(ticket => ticket.number);

    const aiInput: ChooseLotteryWinnersInput = {
      raffleName: raffle.name,
      ticketNumbers,
      winningCriteria: criteria,
      numberOfWinners: winnerCount,
    };

    const result = await chooseLotteryWinners(aiInput);

    return { result, success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'An unexpected error occurred.' };
  }
}

const notifyWinnersSchema = z.object({
    raffleId: z.string(),
    winningNumbers: z.string(),
});

type NotifyState = {
    message?: string;
    error?: string;
    success: boolean;
};

export async function notifyWinnersAction(
    prevState: NotifyState,
    formData: FormData,
): Promise<NotifyState> {
    try {
        const validatedFields = notifyWinnersSchema.safeParse({
            raffleId: formData.get('raffleId'),
            winningNumbers: formData.get('winningNumbers'),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Invalid data." };
        }

        const { raffleId, winningNumbers } = validatedFields.data;
        const raffle = await getRaffleById(raffleId);
        if (!raffle) {
            return { success: false, error: "Raffle not found." };
        }
        
        const tickets = await getTicketsByRaffleId(raffleId);
        const participantPhoneNumbers = [
            ...new Set(
                tickets
                .map(doc => doc.buyerPhone)
                .filter(phone => !!phone) as string[]
            )
        ];

        const notificationInput: SendLotteryResultsInput = {
            raffleName: raffle.name,
            winningNumbers: winningNumbers,
            participantPhoneNumbers: participantPhoneNumbers,
        };

        const result = await sendLotteryResults(notificationInput);

        if (result.success) {
            return { success: true, message: result.message };
        } else {
            return { success: false, error: result.message };
        }

    } catch (e: any) {
        return { success: false, error: e.message || "An unexpected error occurred." };
    }
}


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
        };
    }
    
    const supabase = createSupabaseServerClient(); // Use the server-side client
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('Supabase getUser data:', userData); // Added log
    console.log('Supabase getUser error:', userError); // Added log

    if (userError || !userData?.user) {
        console.error('Authentication failed in createRaffleAction:', userError); // Added log
        return {
            message: 'Authentication Error: User not logged in.',
        };
    }

    const raffleData = validatedFields.data;

    try {
        await apiCreateRaffle({
            ...raffleData,
            deadline: new Date(raffleData.deadline).toISOString(),
            adminId: userData.user.id, // Use the actual authenticated user's ID
        });
    } catch (e: any) {
        return {
            message: `Database Error: Failed to Create Raffle. ${e.message}`,
        };
    }

    revalidatePath('/admin/raffles');
    redirect('/admin/raffles');
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
        };
    }

    const { id, ...dataToUpdate } = validatedFields.data;

    if (!id) {
        return { message: 'Raffle ID not found.' };
    }

    const supabase = createSupabaseServerClient(); // Use the server-side client
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return {
            message: 'Authentication Error: User not logged in.',
        };
    }

    try {
        await apiUpdateRaffle(id, {
            ...dataToUpdate,
            deadline: new Date(dataToUpdate.deadline).toISOString(),
            adminId: userData.user.id, // Ensure adminId is passed for RLS if needed
        });
    } catch (e: any) {
        return { message: `Database Error: Failed to Update Raffle. ${e.message}` };
    }

    revalidatePath(`/admin/raffles`);
    revalidatePath(`/admin/raffles/${id}`);
    revalidatePath(`/raffles/${id}`);
    redirect(`/admin/raffles/${id}`);
}


export async function deleteRaffleAction(formData: FormData) {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    // Handle error: ID is not a string
    return;
  }
  
  const supabase = createSupabaseServerClient(); // Use the server-side client
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
      // This should ideally be handled by RLS, but as a fallback
      return { message: 'Authentication Error: User not logged in.' };
  }

  try {
    await apiDeleteRaffle(id);
  } catch (e) {
    // Handle database error
    return { message: `Database Error: Failed to Delete Raffle. ${e.message}` };
  }

  revalidatePath('/admin/raffles');
  revalidatePath('/');
}