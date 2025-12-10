import { supabase } from '@/integrations/supabase/client-utils';
import { v4 as uuidv4 } from 'uuid';

export async function uploadRaffleImages(files: File[], raffleId: string): Promise<string[]> {
  const imageUrls: string[] = [];
  for (const file of files) {
    const fileExtension = file.name.split('.').pop();
    const path = `${raffleId}/${uuidv4()}.${fileExtension}`; // Ruta única para cada imagen

    const { data, error } = await supabase.storage
      .from('raffle-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('raffle-images')
      .getPublicUrl(path);

    if (publicUrlData) {
      imageUrls.push(publicUrlData.publicUrl);
    }
  }
  return imageUrls;
}

export async function deleteRaffleImages(imageUrls: string[]): Promise<void> {
  const pathsToDelete = imageUrls.map(url => {
    // Extraer la ruta del archivo de la URL pública
    const urlParts = url.split('/');
    const bucketIndex = urlParts.indexOf('raffle-images');
    if (bucketIndex > -1 && urlParts.length > bucketIndex + 1) {
      // La ruta es todo lo que viene después del nombre del bucket
      return urlParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  }).filter(Boolean) as string[]; // Filtrar nulos y asegurar el tipo

  if (pathsToDelete.length > 0) {
    const { error } = await supabase.storage
      .from('raffle-images')
      .remove(pathsToDelete);

    if (error) {
      console.error('Error deleting images:', error);
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  }
}

export async function uploadPaymentMethodImage(file: File, methodId: string): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const path = `payment-methods/${methodId}/${uuidv4()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from('payment-method-images') // Asumiendo que este bucket existe
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading payment method image:', error);
    throw new Error(`Failed to upload payment method image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('payment-method-images')
    .getPublicUrl(path);

  if (!publicUrlData) {
    throw new Error('Failed to get public URL for payment method image.');
  }
  return publicUrlData.publicUrl;
}

export async function deletePaymentMethodImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  const urlParts = imageUrl.split('/');
  const bucketIndex = urlParts.indexOf('payment-method-images');
  if (bucketIndex > -1 && urlParts.length > bucketIndex + 1) {
    const pathToDelete = urlParts.slice(bucketIndex + 1).join('/');
    const { error } = await supabase.storage
      .from('payment-method-images')
      .remove([pathToDelete]);

    if (error) {
      console.error('Error deleting payment method image:', error);
      throw new Error(`Failed to delete payment method image: ${error.message}`);
    }
  }
}