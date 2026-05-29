import { supabase } from '@shared/infrastructure/supabase/client';
import { IAdoptionRepository } from '../../domain/repositories/IAdoptionRepository';
import {
  AdoptionRequest,
  CreateAdoptionRequestDTO,
  UpdateAdoptionStatusDTO,
  createAdoptionFactory,
} from '../../domain/entities/AdoptionRequest';
import { AppError } from '@shared/domain/errors/AppError';

const SELECT_QUERY = `
  *,
  pets(name, photo_url),
  adopter:profiles!adoption_requests_adopter_id_fkey(username),
  shelter:profiles!adoption_requests_shelter_id_fkey(username)
`;

export class SupabaseAdoptionRepository implements IAdoptionRepository {
  async createRequest(dto: CreateAdoptionRequestDTO, adopterId: string): Promise<AdoptionRequest> {
    // Verificar si ya existe una solicitud de este adoptante para esta mascota.
    // La tabla tiene un UNIQUE (pet_id, adopter_id), así que reutilizamos la fila.
    const { data: existing } = await supabase
      .from('adoption_requests')
      .select('id, status')
      .eq('pet_id', dto.petId)
      .eq('adopter_id', adopterId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        throw new AppError('ADOPTION_DUPLICATE', 'Ya tienes una solicitud pendiente para esta mascota.');
      }
      if (existing.status === 'approved') {
        throw new AppError('ADOPTION_DUPLICATE', 'Ya adoptaste a esta mascota.');
      }
      // Estaba rechazada → reactivamos la misma fila a 'pending'
      const { data, error } = await supabase
        .from('adoption_requests')
        .update({
          shelter_id: dto.shelterId,
          message: dto.message ?? null,
          status: 'pending',
        })
        .eq('id', existing.id)
        .select(SELECT_QUERY)
        .maybeSingle();

      if (error) throw new AppError('ADOPTION_CREATE_FAILED', error.message);
      if (!data) {
        // El UPDATE afectó 0 filas: falta la política RLS de UPDATE para el adoptante
        throw new AppError(
          'ADOPTION_UPDATE_FORBIDDEN',
          'No se pudo reenviar la solicitud por permisos. Agrega la política RLS de UPDATE para adoptantes en adoption_requests.',
        );
      }
      return createAdoptionFactory(data);
    }

    const { data, error } = await supabase
      .from('adoption_requests')
      .insert({
        pet_id: dto.petId,
        adopter_id: adopterId,
        shelter_id: dto.shelterId,
        message: dto.message ?? null,
        status: 'pending',
      })
      .select(SELECT_QUERY)
      .single();

    if (error) throw new AppError('ADOPTION_CREATE_FAILED', error.message);
    return createAdoptionFactory(data);
  }

  async getRequestsByAdopter(adopterId: string): Promise<AdoptionRequest[]> {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(SELECT_QUERY)
      .eq('adopter_id', adopterId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('ADOPTION_FETCH_FAILED', error.message);
    return (data ?? []).map(createAdoptionFactory);
  }

  async getRequestsByShelter(shelterId: string): Promise<AdoptionRequest[]> {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(SELECT_QUERY)
      .eq('shelter_id', shelterId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('ADOPTION_FETCH_FAILED', error.message);
    return (data ?? []).map(createAdoptionFactory);
  }

  async updateStatus(dto: UpdateAdoptionStatusDTO): Promise<AdoptionRequest> {
    const { data, error } = await supabase
      .from('adoption_requests')
      .update({ status: dto.status })
      .eq('id', dto.requestId)
      .select(SELECT_QUERY)
      .single();

    if (error) throw new AppError('ADOPTION_UPDATE_FAILED', error.message);

    const request = createAdoptionFactory(data);

    // Sincronizar el estado de la mascota con la decisión del refugio
    const petStatus = dto.status === 'approved' ? 'adopted' : 'available';
    const { error: petError } = await supabase
      .from('pets')
      .update({ status: petStatus })
      .eq('id', request.petId);

    if (petError) {
      console.warn('[updateStatus] No se pudo sincronizar el estado de la mascota:', petError.message);
    }

    return request;
  }

  subscribeToShelterRequests(shelterId: string, callback: (req: AdoptionRequest) => void): () => void {
    const channel = supabase
      .channel(`adoption-shelter-${shelterId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'adoption_requests', filter: `shelter_id=eq.${shelterId}` },
        async (payload) => {
          const { data } = await supabase
            .from('adoption_requests')
            .select(SELECT_QUERY)
            .eq('id', payload.new.id)
            .single();
          if (data) callback(createAdoptionFactory(data));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  subscribeToAdopterRequests(adopterId: string, callback: (req: AdoptionRequest) => void): () => void {
    const channel = supabase
      .channel(`adoption-adopter-${adopterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'adoption_requests', filter: `adopter_id=eq.${adopterId}` },
        async (payload) => {
          const { data } = await supabase
            .from('adoption_requests')
            .select(SELECT_QUERY)
            .eq('id', payload.new.id)
            .single();
          if (data) callback(createAdoptionFactory(data));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
}
