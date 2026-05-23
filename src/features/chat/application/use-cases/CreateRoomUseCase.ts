import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Room, CreateRoomDTO } from '../../domain/entities/Room';
import { User, canCreateRoom } from '@features/auth/domain/entities/User';
import { AppError } from '@shared/domain/errors/AppError';

export class CreateRoomUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(dto: CreateRoomDTO, currentUser: User): Promise<Room> {
    // Regla de negocio: solo sellers pueden crear salas
    if (!canCreateRoom(currentUser)) {
      throw new AppError('FORBIDDEN', 'Solo los vendedores pueden crear salas');
    }
    if (!dto.name.trim()) {
      throw new AppError('VALIDATION_ERROR', 'El nombre de la sala es obligatorio');
    }
    return this.chatRepository.createRoom(dto);
  }
}