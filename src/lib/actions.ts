'use client';

import { z } from 'zod';
import { createRaffle as apiCreateRaffle, updateRaffle as apiUpdateRaffle, deleteRaffle as apiDeleteRaffle, createFaq as apiCreateFaq, updateFaq as apiUpdateFaq, deleteFaq as apiDeleteFaq, getRaffleById, createPaymentMethod as apiCreatePaymentMethod, updatePaymentMethod as apiUpdatePaymentMethod, deletePaymentMethod as apiDeletePaymentMethod, getPaymentMethodById, updateSettings as apiUpdateSettings } from './data';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client-utils';
import { uploadRaffleImages, deleteRaffleImages, uploadPaymentMethodImage, deletePaymentMethodImage } from '@/lib/storage';

// --- Shared auth helper ---
async function requireAuth(): Promise<{ userId: string } | { error: string }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return { error: 'Authentication Error: User not logged in.' };
    }
    return { userId: userData.user.id };
}

// --- File validation constants ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_COUNT = 10;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImageFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" exceeds the 5MB size limit.`;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `File "${file.name}" has an unsupported type. Allowed: JPEG, PNG, WebP, GIF.`;
    }
    return null;
}

// --- Raffle Schemas ---
const RaffleFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
    description: z.string().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or less'),
    price: z.coerce.number().min(0, 'Price must be a positive number').max(1_000_000, 'Price must be 1,000,000 or less'),
    ticketCount: z.coerce.number().min(1, 'Ticket count must be at least 1').max(100_000_000, 'Ticket count must be 100,000,000 or less'),
    deadline: z.string().min(1, 'Deadline is required'),
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
        imageFiles?: string[];
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

        const auth = await requireAuth();
        if ('error' in auth) {
            return { message: auth.error, success: false };
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

        if (validFiles.length > MAX_FILE_COUNT) {
            return {
                errors: { imageFiles: [`Maximum ${MAX_FILE_COUNT} images allowed.`] },
                message: 'Too many images.',
                success: false,
            };
        }

        for (const file of validFiles) {
            const fileError = validateImageFile(file);
            if (fileError) {
                return {
                    errors: { imageFiles: [fileError] },
                    message: 'Invalid image file.',
                    success: false,
                };
            }
        }

        const newRaffle = await apiCreateRaffle({
            ...validatedFields.data,
            images: [],
            deadline: new Date(validatedFields.data.deadline).toISOString(),
            adminId: auth.userId,
        });

        const uploadedImageUrls = await uploadRaffleImages(validFiles, newRaffle.id);

        await apiUpdateRaffle(newRaffle.id, {
            images: uploadedImageUrls,
            adminId: auth.userId,
        });

        return { success: true, raffleId: newRaffle.id, message: 'Raffle created successfully!' };

    } catch (e: unknown) {
        console.error('Error in createRaffleAction:', e);
        return {
            message: 'An unexpected error occurred while creating the raffle.',
            success: false,
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

    const auth = await requireAuth();
    if ('error' in auth) {
        return { message: auth.error, success: false };
    }

    const files = formData.getAll('imageFiles') as File[];
    const validFiles = files.filter(file => file.size > 0);

    if (validFiles.length > MAX_FILE_COUNT) {
        return {
            errors: { imageFiles: [`Maximum ${MAX_FILE_COUNT} images allowed.`] },
            message: 'Too many images.',
            success: false,
        };
    }

    for (const file of validFiles) {
        const fileError = validateImageFile(file);
        if (fileError) {
            return {
                errors: { imageFiles: [fileError] },
                message: 'Invalid image file.',
                success: false,
            };
        }
    }

    let finalImageUrls: string[] = [];

    try {
        const existingRaffle = await getRaffleById(id);
        if (!existingRaffle) {
            return { message: 'Raffle not found for update.', success: false };
        }

        if (validFiles.length > 0) {
            if (existingRaffle.images && existingRaffle.images.length > 0) {
                await deleteRaffleImages(existingRaffle.images);
            }
            finalImageUrls = await uploadRaffleImages(validFiles, id);
        } else {
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
            adminId: auth.userId,
        });

        return { success: true, raffleId: id, message: 'Raffle updated successfully!' };

    } catch (e: unknown) {
        console.error('Error in updateRaffleAction:', e);
        return {
            message: 'An unexpected error occurred while updating the raffle.',
            success: false,
        };
    }
}

export async function deleteRaffleAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') {
    toast({ title: 'Error', description: 'Invalid Raffle ID.', variant: 'destructive' });
    return;
  }

  const auth = await requireAuth();
  if ('error' in auth) {
    toast({ title: 'Error', description: auth.error, variant: 'destructive' });
    return;
  }

  try {
    const existingRaffle = await getRaffleById(id);
    if (existingRaffle && existingRaffle.images && existingRaffle.images.length > 0) {
      await deleteRaffleImages(existingRaffle.images);
    }

    await apiDeleteRaffle(id);
    toast({ title: 'Success', description: 'Raffle deleted successfully.' });
  } catch (e: unknown) {
    console.error('Error in deleteRaffleAction:', e);
    toast({ title: 'Error', description: 'An unexpected error occurred while deleting the raffle.', variant: 'destructive' });
  }
}

// --- FAQ Actions ---

const FaqFormSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(1, 'Question is required').max(500, 'Question must be 500 characters or less'),
    answer: z.string().min(1, 'Answer is required').max(5000, 'Answer must be 5000 characters or less'),
    orderIndex: z.coerce.number().min(0, 'Order index must be a non-negative number').max(1000, 'Order index must be 1000 or less'),
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
        const auth = await requireAuth();
        if ('error' in auth) {
            return { message: auth.error, success: false };
        }

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
        console.error('Error in createFaqAction:', e);
        return {
            message: 'An unexpected error occurred while creating the FAQ.',
            success: false,
        };
    }
}

export async function updateFaqAction(prevState: FaqActionState, formData: FormData): Promise<FaqActionState> {
    const auth = await requireAuth();
    if ('error' in auth) {
        return { message: auth.error, success: false };
    }

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
        console.error('Error in updateFaqAction:', e);
        return {
            message: 'An unexpected error occurred while updating the FAQ.',
            success: false,
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

  const auth = await requireAuth();
  if ('error' in auth) {
    toast({ title: 'Error', description: auth.error, variant: 'destructive' });
    return;
  }

  try {
    await apiDeleteFaq(id);
    toast({ title: 'Success', description: 'FAQ deleted successfully.' });
  } catch (e: unknown) {
    console.error('Error in deleteFaqAction:', e);
    toast({ title: 'Error', description: 'An unexpected error occurred while deleting the FAQ.', variant: 'destructive' });
  }
}

// --- Payment Method Actions ---

const PaymentMethodFormSchema = z.object({
    id: z.string().optional(),
    bankName: z.string().min(1, 'Bank Name is required').max(200, 'Bank Name must be 200 characters or less'),
    accountNumber: z.string().min(1, 'Account Number is required').max(50, 'Account Number must be 50 characters or less'),
    recipientName: z.string().min(1, 'Recipient Name is required').max(200, 'Recipient Name must be 200 characters or less'),
});

const CreatePaymentMethod = PaymentMethodFormSchema;
const UpdatePaymentMethod = PaymentMethodFormSchema;

type PaymentMethodActionState = {
    errors?: {
        bankName?: string[];
        accountNumber?: string[];
        recipientName?: string[];
        imageFile?: string[];
    };
    message?: string;
    success?: boolean;
    paymentMethodId?: string;
};

export async function createPaymentMethodAction(prevState: PaymentMethodActionState, formData: FormData): Promise<PaymentMethodActionState> {
    try {
        const auth = await requireAuth();
        if ('error' in auth) {
            return { message: auth.error, success: false };
        }

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

        if (file && file.size > 0) {
            const fileError = validateImageFile(file);
            if (fileError) {
                return {
                    errors: { imageFile: [fileError] },
                    message: 'Invalid image file.',
                    success: false,
                };
            }

            const tempPaymentMethod = await apiCreatePaymentMethod({
                ...validatedFields.data,
                bankImageUrl: '',
            });

            const bankImageUrl = await uploadPaymentMethodImage(file, tempPaymentMethod.id);
            await apiUpdatePaymentMethod(tempPaymentMethod.id, { bankImageUrl });
            return { success: true, paymentMethodId: tempPaymentMethod.id, message: 'Payment method created successfully!' };
        } else {
            const newPaymentMethod = await apiCreatePaymentMethod(validatedFields.data);
            return { success: true, paymentMethodId: newPaymentMethod.id, message: 'Payment method created successfully!' };
        }

    } catch (e: unknown) {
        console.error('Error in createPaymentMethodAction:', e);
        return {
            message: 'An unexpected error occurred while creating the payment method.',
            success: false,
        };
    }
}

export async function updatePaymentMethodAction(prevState: PaymentMethodActionState, formData: FormData): Promise<PaymentMethodActionState> {
    const auth = await requireAuth();
    if ('error' in auth) {
        return { message: auth.error, success: false };
    }

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

    if (file && file.size > 0) {
        const fileError = validateImageFile(file);
        if (fileError) {
            return {
                errors: { imageFile: [fileError] },
                message: 'Invalid image file.',
                success: false,
            };
        }
    }

    let finalBankImageUrl: string | undefined = undefined;

    try {
        const existingPaymentMethod = await getPaymentMethodById(id);

        if (file && file.size > 0) {
            if (existingPaymentMethod?.bankImageUrl) {
                await deletePaymentMethodImage(existingPaymentMethod.bankImageUrl);
            }
            finalBankImageUrl = await uploadPaymentMethodImage(file, id);
        } else {
            finalBankImageUrl = existingPaymentMethod?.bankImageUrl;
        }

        await apiUpdatePaymentMethod(id, { ...dataToUpdate, bankImageUrl: finalBankImageUrl });
    } catch (e: unknown) {
        console.error('Error in updatePaymentMethodAction:', e);
        return {
            message: 'An unexpected error occurred while updating the payment method.',
            success: false,
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

  const auth = await requireAuth();
  if ('error' in auth) {
    toast({ title: 'Error', description: auth.error, variant: 'destructive' });
    return;
  }

  try {
    const existingPaymentMethod = await getPaymentMethodById(id);
    if (existingPaymentMethod?.bankImageUrl) {
      await deletePaymentMethodImage(existingPaymentMethod.bankImageUrl);
    }

    await apiDeletePaymentMethod(id);
    toast({ title: 'Success', description: 'Payment method deleted successfully.' });
  } catch (e: unknown) {
    console.error('Error in deletePaymentMethodAction:', e);
    toast({ title: 'Error', description: 'An unexpected error occurred while deleting the payment method.', variant: 'destructive' });
  }
}

// --- Settings Actions ---

const SettingsFormSchema = z.object({
    reservationDurationMinutes: z.coerce.number().min(1, 'Minimum 1 minute').max(1440, 'Maximum 1440 minutes (24 hours)'),
});

type SettingsActionState = {
    message?: string;
    success?: boolean;
    errors?: {
        reservationDurationMinutes?: string[];
    };
};

export async function updateSettingsAction(prevState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
    try {
        const auth = await requireAuth();
        if ('error' in auth) {
            return { message: auth.error, success: false };
        }

        const validatedFields = SettingsFormSchema.safeParse(Object.fromEntries(formData.entries()));

        if (!validatedFields.success) {
            return {
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Failed to update settings. Please check the fields.',
                success: false,
            };
        }

        await apiUpdateSettings(validatedFields.data);

        return { success: true, message: 'Settings updated successfully!' };
    } catch (e: unknown) {
        console.error('Error in updateSettingsAction:', e);
        return {
            message: 'An unexpected error occurred while updating settings.',
            success: false,
        };
    }
}
