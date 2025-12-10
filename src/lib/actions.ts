'use client';

import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, createFaq as apiCreateFaq, updateFaq as apiUpdateFaq, deleteFaq as apiDeleteFaq, getRaffleById, createPaymentMethod as apiCreatePaymentMethod, updatePaymentMethod as apiUpdatePaymentMethod, deletePaymentMethod as apiDeletePaymentMethod, getPaymentMethodById } from './data';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-utils'; // Import client-side supabase
import { uploadRaffleImages, deleteRaffleImages, uploadPaymentMethodImage, deletePaymentMethodImage } from '@/lib/storage'; // Import storage functions

const RaffleFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1'),
    deadline: z.string().min(1, 'Deadline is required'),
    // imageUrls will be handled as files directly in the action
});

const CreateRaffle = RaffleFormSchema.omit({ id: true });
const UpdateRaffle = RaffleFormSchema.omit({ ticketCount: true });

type RaffleActionState = {
    errors?: {
        name?: string[];
        description?: string[];
        price?: string[];
        ticketCount?: string[];
        deadline?: string[];
        imageFiles?: string[]; // Error for image files
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

        const files = formData.getAll('imageFiles') as File[];
        const validFiles = files.filter(file => file.size > 0);

        if (validFiles.length === 0) {
            return {
                errors: { imageFiles: ['At least one image is required.'] },
                message: 'Failed to create raffle. Please upload at least one image.',
                success: false,
            };
        }

        // First create the raffle with empty images to get an ID
        const newRaffle = await apiCreateRaffle({
            ...validatedFields.data,
            images: [], // Placeholder, will be updated after upload
            deadline: new Date(validatedFields.data.deadline).toISOString(),
            adminId: userData.user.id,
        });

        // Upload images using the new raffle ID
        const uploadedImageUrls = await uploadRaffleImages(validFiles, newRaffle.id);

        // Update the raffle with the actual image URLs
        const updatedRaffle = await apiUpdateRaffle(newRaffle.id, {
            images: uploadedImageUrls,
            adminId: userData.user.id, // Ensure adminId is passed for RLS
        });

        return { success: true, raffleId: updatedRaffle?.id, message: 'Raffle created successfully!' };

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
    const id = formData.get('id') as string;
    if (!id) {
        return { message: 'Raffle ID not found.', success: false };
    }

    const validatedFields = UpdateRaffle.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update raffle. Please check the fields.',
            success: false,
        };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return {
            message: 'Authentication Error: User not logged in.',
            success: false,
        };
    }

    const files = formData.getAll('imageFiles') as File[];
    const validFiles = files.filter(file => file.size > 0);

    let finalImageUrls: string[] = [];

    try {
        const existingRaffle = await getRaffleById(id);
        if (!existingRaffle) {
            return { message: 'Raffle not found for update.', success: false };
        }

        if (validFiles.length > 0) {
            // If new files are uploaded, delete old ones and upload new ones
            if (existingRaffle.images && existingRaffle.images.length > 0) {
                await deleteRaffleImages(existingRaffle.images);
            }
            finalImageUrls = await uploadRaffleImages(validFiles, id);
        } else {
            // If no new files, keep existing images
            finalImageUrls = existingRaffle.images || [];
        }

        if (finalImageUrls.length === 0) {
             return {
                errors: { imageFiles: ['At least one image is required.'] },
                message: 'Failed to update raffle. Please upload at least one image.',
                success: false,
            };
        }

        await apiUpdateRaffle(id, {
            ...validatedFields.data,
            images: finalImageUrls,
            deadline: new Date(validatedFields.data.deadline).toISOString(),
            adminId: userData.user.id,
        });

        return { success: true, raffleId: id, message: 'Raffle updated successfully!' };

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { 
            message: `Database Error: Failed to Update Raffle. ${errorMessage}`, 
            success: false,
            errors: undefined,
            raffleId: undefined,
        };
    }
}

export async function deleteRaffleAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid Raffle ID.', variant: 'destructive' });
    return;
  }

  try {
    // Get existing raffle to delete associated images
    const existingRaffle = await getRaffleById(id);
    if (existingRaffle && existingRaffle.images && existingRaffle.images.length > 0) {
      await deleteRaffleImages(existingRaffle.images);
    }

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

// --- Payment Method Actions ---

const PaymentMethodFormSchema = z.object({
    id: z.string().optional(),
    bankName: z.string().min(1, 'Bank Name is required'),
    accountNumber: z.string().min(1, 'Account Number is required'),
    recipientName: z.string().min(1, 'Recipient Name is required'),
    // bankImageUrl is now handled as a file upload, not a direct URL input
});

const CreatePaymentMethod = PaymentMethodFormSchema; // No omitir id aquí, se maneja en la acción
const UpdatePaymentMethod = PaymentMethodFormSchema;

type PaymentMethodActionState = {
    errors?: {
        bankName?: string[];
        accountNumber?: string[];
        recipientName?: string[];
        imageFile?: string[]; // Error for image file
    };
    message?: string;
    success?: boolean;
    paymentMethodId?: string;
};

export async function createPaymentMethodAction(prevState: PaymentMethodActionState, formData: FormData): Promise<PaymentMethodActionState> {
    try {
        const entriesObj = Object.fromEntries(formData.entries());
        const validatedFields = CreatePaymentMethod.safeParse(entriesObj);

        if (!validatedFields.success) {
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Failed to create payment method. Please check the fields.',
                success: false,
            };
        }

        const file = formData.get('imageFile') as File;
        let bankImageUrl: string | undefined = undefined;

        if (file && file.size > 0) {
            // First create the payment method with a placeholder image URL to get an ID
            const tempPaymentMethod = await apiCreatePaymentMethod({
                ...validatedFields.data,
                bankImageUrl: '', // Placeholder
            });
            
            bankImageUrl = await uploadPaymentMethodImage(file, tempPaymentMethod.id);
            await apiUpdatePaymentMethod(tempPaymentMethod.id, { bankImageUrl }); // Update with actual URL
            return { success: true, paymentMethodId: tempPaymentMethod.id, message: 'Payment method created successfully!' };
        } else {
            // If no file, create without image URL
            const newPaymentMethod = await apiCreatePaymentMethod(validatedFields.data);
            return { success: true, paymentMethodId: newPaymentMethod.id, message: 'Payment method created successfully!' };
        }

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
            message: `Database Error: ${errorMessage}`,
            success: false,
            errors: undefined,
            paymentMethodId: undefined,
        };
    }
}

export async function updatePaymentMethodAction(prevState: PaymentMethodActionState, formData: FormData): Promise<PaymentMethodActionState> {
    const entriesObj = Object.fromEntries(formData.entries());
    const validatedFields = UpdatePaymentMethod.safeParse(entriesObj);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update payment method. Please check the fields.',
            success: false,
        };
    }

    const { id, ...dataToUpdate } = validatedFields.data;

    if (!id) {
        return { message: 'Payment Method ID not found.', success: false };
    }

    const file = formData.get('imageFile') as File;
    let finalBankImageUrl: string | undefined = undefined;

    try {
        const existingPaymentMethod = await getPaymentMethodById(id);

        if (file && file.size > 0) {
            // New file uploaded: delete old image if exists, then upload new one
            if (existingPaymentMethod?.bankImageUrl) {
                await deletePaymentMethodImage(existingPaymentMethod.bankImageUrl);
            }
            finalBankImageUrl = await uploadPaymentMethodImage(file, id);
        } else {
            // No new file: keep existing image URL
            finalBankImageUrl = existingPaymentMethod?.bankImageUrl;
        }

        await apiUpdatePaymentMethod(id, { ...dataToUpdate, bankImageUrl: finalBankImageUrl });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
            message: `Database Error: Failed to Update Payment Method. ${errorMessage}`,
            success: false,
            errors: undefined,
            paymentMethodId: undefined,
        };
    }

    return { success: true, paymentMethodId: id, message: 'Payment method updated successfully!' };
}

export async function deletePaymentMethodAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid Payment Method ID.', variant: 'destructive' });
    return;
  }

  try {
    // Get existing payment method to delete associated image
    const existingPaymentMethod = await getPaymentMethodById(id);
    if (existingPaymentMethod?.bankImageUrl) {
      await deletePaymentMethodImage(existingPaymentMethod.bankImageUrl);
    }

    await apiDeletePaymentMethod(id);
    toast({ title: 'Success', description: 'Payment method deleted successfully.' });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast({ title: 'Error', description: `Database Error: Failed to Delete Payment Method. ${errorMessage}`, variant: 'destructive' });
  }
}