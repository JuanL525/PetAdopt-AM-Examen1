import { supabase } from '@shared/infrastructure/supabase/client';
import { IPetRepository } from '../../domain/repositories/IPetRepository';
import { Pet, CreatePetDTO, UpdatePetDTO, createPetFactory } from '../../domain/entities/Pet';
import { AppError } from '@shared/domain/errors/AppError';

export class SupabasePetRepository implements IPetRepository {
  private readonly BUCKET = 'pet-photos';

  async getPets(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });

    if (error) throw new AppError('PETS_FETCH_FAILED', error.message);
    return (data ?? []).map(createPetFactory);
  }

  async getPetById(id: string): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .select('*, profiles(username)')
      .eq('id', id)
      .single();

    if (error) throw new AppError('PET_NOT_FOUND', error.message);
    return createPetFactory(data);
  }

  async getPetsByShelterId(shelterId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*, profiles(username)')
      .eq('shelter_id', shelterId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('PETS_FETCH_FAILED', error.message);
    return (data ?? []).map(createPetFactory);
  }

  async createPet(dto: CreatePetDTO, shelterId: string): Promise<Pet> {
    // Crear la sala de chat vinculada a esta mascota
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({ name: `Chat · ${dto.name}`, created_by: shelterId })
      .select()
      .single();

    if (roomError) {
      console.warn('[createPet] No se pudo crear la sala de chat:', roomError.message);
    }

    if (roomData) {
      const { error: memberError } = await supabase
        .from('room_members')
        .upsert(
          { room_id: roomData.id, user_id: shelterId },
          { onConflict: 'room_id,user_id', ignoreDuplicates: true },
        );
      if (memberError) {
        console.warn('[createPet] No se pudo unir al refugio a la sala:', memberError.message);
      }
    }

    const { data, error } = await supabase
      .from('pets')
      .insert({
        shelter_id: shelterId,
        name: dto.name,
        breed: dto.breed,
        age: dto.age,
        size: dto.size,
        description: dto.description,
        status: 'available',
        room_id: roomData?.id ?? null,
      })
      .select('*, profiles(username)')
      .single();

    if (error) throw new AppError('PET_CREATE_FAILED', error.message);

    const pet = createPetFactory(data);

    if (dto.photoBase64 || dto.photoUri) {
      const photoUrl = await this.uploadPhoto(pet.id, dto.photoBase64, dto.photoUri);
      if (photoUrl) {
        await supabase.from('pets').update({ photo_url: photoUrl }).eq('id', pet.id);
        pet.photoUrl = photoUrl;
      }
    }

    return pet;
  }

  async updatePet(dto: UpdatePetDTO): Promise<Pet> {
    const updates: any = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.breed !== undefined) updates.breed = dto.breed;
    if (dto.age !== undefined) updates.age = dto.age;
    if (dto.size !== undefined) updates.size = dto.size;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.roomId !== undefined) updates.room_id = dto.roomId;

    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', dto.id)
      .select('*, profiles(username)')
      .single();

    if (error) throw new AppError('PET_UPDATE_FAILED', error.message);

    const pet = createPetFactory(data);

    if (dto.photoBase64 || dto.photoUri) {
      const photoUrl = await this.uploadPhoto(pet.id, dto.photoBase64, dto.photoUri);
      if (photoUrl) {
        await supabase.from('pets').update({ photo_url: photoUrl }).eq('id', pet.id);
        pet.photoUrl = photoUrl;
      }
    }

    return pet;
  }

  async deletePet(id: string): Promise<void> {
    const { error } = await supabase.from('pets').delete().eq('id', id);
    if (error) throw new AppError('PET_DELETE_FAILED', error.message);
  }

  private async uploadPhoto(petId: string, base64?: string, uri?: string): Promise<string | null> {
    try {
      const fileName = `${petId}/photo.jpg`;
      let payload: ArrayBuffer | Blob;

      if (base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        payload = bytes.buffer;
      } else if (uri) {
        payload = await new Promise<Blob>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = reject;
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      } else {
        return null;
      }

      const { error } = await supabase.storage
        .from(this.BUCKET)
        .upload(fileName, payload, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from(this.BUCKET).getPublicUrl(fileName);
      return data.publicUrl + '?t=' + Date.now();
    } catch (e) {
      console.warn('[SupabasePetRepository] Photo upload failed:', e);
      return null;
    }
  }
}
