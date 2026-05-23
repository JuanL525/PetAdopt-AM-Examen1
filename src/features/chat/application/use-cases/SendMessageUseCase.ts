import { Message } from "../../domain/entities/Message";
import { IChatRepository } from "../../domain/repositories/IChatRepository";
import { AppError } from "@shared/domain/errors/AppError";

export class SendMessageUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(roomId: string, content: string): Promise<Message> {
    const trimmed = content.trim();

    if (!trimmed) throw new AppError("VALIDATION_ERROR", "El mensaje no puede estar vacío");
    if (trimmed.length > 500) throw new AppError("VALIDATION_ERROR", "Máximo 500 caracteres");

    return this.chatRepo.sendMessage(roomId, trimmed);
  }
}