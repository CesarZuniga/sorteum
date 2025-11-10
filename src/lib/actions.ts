'use server';

import { chooseLotteryWinners, ChooseLotteryWinnersInput, ChooseLotteryWinnersOutput } from '@/ai/flows/choose-lottery-winners-with-gen-ai';
import { sendLotteryResults, SendLotteryResultsInput } from '@/ai/flows/automated-lottery-result-notifications';
import { z } from 'zod';
import { getRaffleById, createRaffle as apiCreateRaffle } from './data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const drawWinnerSchema = z.object({
  raffleId: z.string(),
  criteria: z.string().min(10, 'Please provide more detailed criteria.'),
  winnerCount: z.number().min(1),
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
    const raffle = getRaffleById(raffleId);

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
        const raffle = getRaffleById(raffleId);
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


const createRaffleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1'),
    deadline: z.string().min(1, 'Deadline is required'),
    image: z.string().url('Must be a valid image URL'),
});

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
    const validatedFields = createRaffleSchema.safeParse({
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
        apiCreateRaffle({
            ...validatedFields.data,
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
