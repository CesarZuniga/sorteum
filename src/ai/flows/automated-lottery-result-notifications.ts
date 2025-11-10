'use server';
/**
 * @fileOverview Sends SMS notifications to lottery participants with the lottery results after the draw is completed.
 *
 * - sendLotteryResults - A function that sends the lottery results to participants.
 * - SendLotteryResultsInput - The input type for the sendLotteryResults function.
 * - SendLotteryResultsOutput - The return type for the sendLotteryResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendLotteryResultsInputSchema = z.object({
  raffleName: z.string().describe('The name of the raffle.'),
  winningNumbers: z.string().describe('The winning ticket numbers.'),
  participantPhoneNumbers: z.array(z.string()).describe('List of participant phone numbers to send SMS notifications to.'),
});
export type SendLotteryResultsInput = z.infer<typeof SendLotteryResultsInputSchema>;

const SendLotteryResultsOutputSchema = z.object({
  success: z.boolean().describe('Indicates if the SMS notifications were sent successfully.'),
  message: z.string().optional().describe('A message providing more details about the notification process.'),
});
export type SendLotteryResultsOutput = z.infer<typeof SendLotteryResultsOutputSchema>;

export async function sendLotteryResults(input: SendLotteryResultsInput): Promise<SendLotteryResultsOutput> {
  return sendLotteryResultsFlow(input);
}

const sendLotteryResultsPrompt = ai.definePrompt({
  name: 'sendLotteryResultsPrompt',
  input: {schema: SendLotteryResultsInputSchema},
  prompt: `You are an automated system that sends SMS notifications to lottery participants with the lottery results.
  Raffle Name: {{{raffleName}}}
  Winning Numbers: {{{winningNumbers}}}

  Send the following message to each of these participant phone numbers:
  {{#each participantPhoneNumbers}}
  To: {{{this}}}, Message: Congratulations! The results for the {{{../raffleName}}} raffle are in! Winning numbers: {{{../winningNumbers}}}. Check your tickets!
  {{/each}}`,
});

const sendLotteryResultsFlow = ai.defineFlow(
  {
    name: 'sendLotteryResultsFlow',
    inputSchema: SendLotteryResultsInputSchema,
    outputSchema: SendLotteryResultsOutputSchema,
  },
  async input => {
    try {
      // This is where you would integrate with an SMS service like Twilio.
      // For now, we'll just log the messages that would be sent.
      const {output} = await sendLotteryResultsPrompt(input);
      console.log("Generated output:", output);

      // Simulate sending SMS messages.
      input.participantPhoneNumbers.forEach(phoneNumber => {
        console.log(`Sending SMS to ${phoneNumber}: Congratulations! The results for the ${input.raffleName} raffle are in! Winning numbers: ${input.winningNumbers}. Check your tickets!`);
      });

      return {
        success: true,
        message: `SMS notifications sent to ${input.participantPhoneNumbers.length} participants.`, // number of participants
      };
    } catch (error: any) {
      console.error('Error sending SMS notifications:', error);
      return {
        success: false,
        message: `Failed to send SMS notifications: ${error.message}`,
      };
    }
  }
);
