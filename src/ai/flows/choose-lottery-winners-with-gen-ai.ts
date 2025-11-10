// src/ai/flows/choose-lottery-winners-with-gen-ai.ts
'use server';
/**
 * @fileOverview Chooses lottery winners using GenAI based on specified criteria.
 *
 * - chooseLotteryWinners - A function that handles the lottery winner selection process.
 * - ChooseLotteryWinnersInput - The input type for the chooseLotteryWinners function.
 * - ChooseLotteryWinnersOutput - The return type for the chooseLotteryWinners function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChooseLotteryWinnersInputSchema = z.object({
  raffleName: z.string().describe('The name of the raffle.'),
  ticketNumbers: z
    .array(z.number())
    .describe('An array of ticket numbers participating in the lottery.'),
  winningCriteria: z
    .string()
    .describe(
      'The criteria for selecting the winner(s), such as fairness, randomness, or a specific winning condition.'
    ),
  numberOfWinners: z
    .number()
    .describe('The number of winners to select based on the criteria.'),
});
export type ChooseLotteryWinnersInput = z.infer<typeof ChooseLotteryWinnersInputSchema>;

const ChooseLotteryWinnersOutputSchema = z.object({
  winningTicketNumbers: z
    .array(z.number())
    .describe('An array containing the winning ticket numbers.'),
  reasoning: z
    .string()
    .describe('Explanation of why these tickets were selected as winners.'),
});
export type ChooseLotteryWinnersOutput = z.infer<typeof ChooseLotteryWinnersOutputSchema>;

export async function chooseLotteryWinners(input: ChooseLotteryWinnersInput): Promise<ChooseLotteryWinnersOutput> {
  return chooseLotteryWinnersFlow(input);
}

const chooseLotteryWinnersPrompt = ai.definePrompt({
  name: 'chooseLotteryWinnersPrompt',
  input: {schema: ChooseLotteryWinnersInputSchema},
  output: {schema: ChooseLotteryWinnersOutputSchema},
  prompt: `You are an AI assistant specialized in selecting lottery winners based on specific criteria.

You are provided with the raffle name, available ticket numbers, the winning criteria, and the number of winners to select.

Raffle Name: {{{raffleName}}}
Ticket Numbers: {{{ticketNumbers}}}
Winning Criteria: {{{winningCriteria}}}
Number of Winners: {{{numberOfWinners}}}

Based on the provided information, select the winning ticket numbers and explain your reasoning for the selection. Return your answer as a JSON object.
`,
});

const chooseLotteryWinnersFlow = ai.defineFlow(
  {
    name: 'chooseLotteryWinnersFlow',
    inputSchema: ChooseLotteryWinnersInputSchema,
    outputSchema: ChooseLotteryWinnersOutputSchema,
  },
  async input => {
    const {output} = await chooseLotteryWinnersPrompt(input);
    return output!;
  }
);
