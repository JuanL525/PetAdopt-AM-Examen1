import { IPetRepository } from '../../domain/repositories/IPetRepository';
import { Pet, CreatePetDTO } from '../../domain/entities/Pet';
import { User } from '@features/auth/domain/entities/User';
import { AppError } from '@shared/domain/errors/AppError';

export class CreatePetUseCase {
  constructor(private readonly petRepository: IPetRepository) {}

  async execute(dto: CreatePetDTO, currentUser: User): Promise<Pet> {
    if (currentUser.role !== 'refugio') {
      throw new AppError('FORBIDDEN', 'Solo los refugios pueden registrar mascotas');
    }
    if (!dto.name.trim()) {
      throw new AppError('VALIDATION_ERROR', 'El nombre de la mascota es obligatorio');
    }
    if (!dto.breed.trim()) {
      throw new AppError('VALIDATION_ERROR', 'La raza es obligatoria');
    }
    if (/\d/.test(dto.breed)) {
      throw new AppError('VALIDATION_ERROR', 'La raza no puede contener números');
    }
    if (!dto.photoUri && !dto.photoBase64) {
      throw new AppError('VALIDATION_ERROR', 'La foto es obligatoria');
    }
    if (dto.age < 0) {
      throw new AppError('VALIDATION_ERROR', 'La edad no puede ser negativa');
    }
    return this.petRepository.createPet(dto, currentUser.id);
  }
}
