'use server';

import { chooseLotteryWinners, ChooseLotteryWinnersInput, ChooseLotteryWinnersOutput } from '@/ai/flows/choose-lottery-winners-with-gen-ai';
import { sendLotteryResults, SendLotteryResultsInput } from '@/ai/flows/automated-lottery-result-notifications';
import { z } from 'zod';
import { getRaffleById, createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle } from './data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Ticket } from './definitions';

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

    const ticketNumbers = raffle.tickets.map((t) => t.number);

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

        const participantPhoneNumbers = [
            ...new Set(
                raffle.tickets
                .filter(t => t.buyerPhone)
                .map(t => t.buyerPhone!)
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
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1').optional(),
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

    try {
        await apiCreateRaffle({
            ...validatedFields.data,
            // @ts-ignore
            ticketCount: validatedFields.data.ticketCount,
            deadline: new Date(validatedFields.data.deadline).toISOString(),
        });
    } catch (e) {
        return {
            message: 'Database Error: Failed to Create Raffle.',
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

    try {
        await apiUpdateRaffle(id, {
            ...dataToUpdate,
            deadline: new Date(dataToUpdate.deadline).toISOString(),
        });
    } catch (e) {
        return { message: 'Database Error: Failed to Update Raffle.' };
    }

    revalidatePath(`/admin/raffles`);
    revalidatePath(`/admin/raffles/${id}`);
    redirect(`/admin/raffles/${id}`);
}


export async function deleteRaffleAction(formData: FormData) {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    // Handle error: ID is not a string
    return;
  }
  
  try {
    await apiDeleteRaffle(id);
  } catch (e) {
    // Handle database error
    return;
  }

  revalidatePath('/admin/raffles');
  // No redirect needed if revalidating
}
