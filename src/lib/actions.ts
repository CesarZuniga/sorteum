'use server';

import { chooseLotteryWinners, ChooseLotteryWinnersInput, ChooseLotteryWinnersOutput } from '@/ai/flows/choose-lottery-winners-with-gen-ai';
import { sendLotteryResults, SendLotteryResultsInput } from '@/ai/flows/automated-lottery-result-notifications';
import { z } from 'zod';
import { getRaffleById } from './data';

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
