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