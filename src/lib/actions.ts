'use server';

import { chooseLotteryWinners, ChooseLotteryWinnersInput, ChooseLotteryWinnersOutput } from '@/ai/flows/choose-lottery-winners-with-gen-ai';
import { sendLotteryResults, SendLotteryResultsInput } from '@/ai/flows/automated-lottery-result-notifications';
import { z } from 'zod';
import { getRaffleById, createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle } from './data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { initializeFirebaseServer } from '@/firebase/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const { firestore } = initializeFirebaseServer();
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
    const raffle = await getRaffleById(firestore, raffleId);

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
    const { firestore } = initializeFirebaseServer();
    try {
        const validatedFields = notifyWinnersSchema.safeParse({
            raffleId: formData.get('raffleId'),
            winningNumbers: formData.get('winningNumbers'),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Invalid data." };
        }

        const { raffleId, winningNumbers } = validatedFields.data;
        const raffle = await getRaffleById(firestore, raffleId);
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


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const FormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1'),
    deadline: z.string().min(1, 'Deadline is required'),
    image: z.any()
      .refine(file => file?.size, 'Image is required.')
      .refine(file => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
      .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), '.jpg, .jpeg, .png and .webp files are accepted.'),
});

const CreateRaffle = FormSchema.omit({ id: true });
const UpdateRaffle = FormSchema.omit({ ticketCount: true }).extend({
    image: z.any()
        .optional()
        .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), '.jpg, .jpeg, .png and .webp files are accepted.'),
    currentImage: z.string().optional()
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
    const { firestore, storage } = initializeFirebaseServer();
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
    
    const { image, ...raffleData } = validatedFields.data;

    try {
        const fileBuffer = Buffer.from(await image.arrayBuffer());
        const imageName = `${Date.now()}-${image.name}`;
        const imageRef = ref(storage, `raffles/${imageName}`);
        await uploadBytes(imageRef, fileBuffer, { contentType: image.type });
        const imageUrl = await getDownloadURL(imageRef);

        await apiCreateRaffle(firestore, {
            ...raffleData,
            image: imageUrl,
            deadline: new Date(raffleData.deadline).toISOString(),
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
    const { firestore, storage } = initializeFirebaseServer();
    const validatedFields = UpdateRaffle.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        deadline: formData.get('deadline'),
        image: formData.get('image'),
        currentImage: formData.get('currentImage'),
    });
     if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update raffle. Please check the fields.',
        };
    }

    const { id, image, currentImage, ...dataToUpdate } = validatedFields.data;

    if (!id) {
        return { message: 'Raffle ID not found.' };
    }

    let imageUrl = currentImage;

    try {
        if (image && image.size > 0) {
            const fileBuffer = Buffer.from(await image.arrayBuffer());
            const imageName = `${Date.now()}-${image.name}`;
            const imageRef = ref(storage, `raffles/${imageName}`);
            await uploadBytes(imageRef, fileBuffer, { contentType: image.type });
            imageUrl = await getDownloadURL(imageRef);
        }

        await apiUpdateRaffle(firestore, id, {
            ...dataToUpdate,
            image: imageUrl,
            deadline: new Date(dataToUpdate.deadline).toISOString(),
        });
    } catch (e: any) {
        return { message: `Database Error: Failed to Update Raffle. ${e.message}` };
    }

    revalidatePath(`/admin/raffles`);
    revalidatePath(`/admin/raffles/${id}`);
    redirect(`/admin/raffles/${id}`);
}


export async function deleteRaffleAction(formData: FormData) {
  const { firestore } = initializeFirebaseServer();
  const id = formData.get('id');
  if (typeof id !== 'string') {
    // Handle error: ID is not a string
    return;
  }
  
  try {
    await apiDeleteRaffle(firestore, id);
  } catch (e) {
    // Handle database error
    return;
  }

  revalidatePath('/admin/raffles');
  // No redirect needed if revalidating
}

    