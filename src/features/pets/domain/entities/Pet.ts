export type PetStatus = 'available' | 'adopted' | 'pending';
export type PetSize = 'small' | 'medium' | 'large';

export interface Pet {
  id: string;
  shelterId: string;
  shelterName?: string;
  name: string;
  breed: string;
  age: number;
  size: PetSize;
  description: string;
  photoUrl: string | null;
  status: PetStatus;
  roomId: string | null;
  createdAt: string;
}

export interface CreatePetDTO {
  name: string;
  breed: string;
  age: number;
  size: PetSize;
  description: string;
  photoUri?: string;
  photoBase64?: string;
}

export interface UpdatePetDTO {
  id: string;
  name?: string;
  breed?: string;
  age?: number;
  size?: PetSize;
  description?: string;
  status?: PetStatus;
  roomId?: string;
  photoUri?: string;
  photoBase64?: string;
}

export function createPetFactory(raw: any): Pet {
  return {
    id: raw.id,
    shelterId: raw.shelter_id,
    shelterName: raw.profiles?.username ?? undefined,
    name: raw.name,
    breed: raw.breed,
    age: raw.age,
    size: raw.size ?? 'medium',
    description: raw.description ?? '',
    photoUrl: raw.photo_url ?? null,
    status: raw.status ?? 'available',
    roomId: raw.room_id ?? null,
    createdAt: raw.created_at,
  };
}

export type AgeUnit = 'months' | 'years';

/** Codifica edad: meses 1–12 tal cual; años 1–20 como 101–120 */
export function encodePetAge(value: number, unit: AgeUnit): number {
  return unit === 'months' ? value : 100 + value;
}

/** Texto legible según codificación de edad */
export function formatPetAge(age: number): string {
  if (age <= 12) {
    return `${age} ${age === 1 ? 'mes' : 'meses'}`;
  }
  if (age >= 101) {
    const years = age - 100;
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  return `${age} ${age === 1 ? 'año' : 'años'}`;
}
