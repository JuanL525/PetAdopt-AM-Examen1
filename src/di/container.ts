import { SupabaseAuthRepository } from '@features/auth/infrastructure/repositories/SupabaseAuthRepository';
import { SupabaseChatRepository } from '@features/chat/infrastructure/repositories/SupabaseChatRepository';
import { AppwriteAuthRepository } from '@features/auth/infrastructure/repositories/AppwriteAuthRepository';
import { AppwriteChatRepository } from '@features/chat/infrastructure/repositories/AppwriteChatRepository';
import { SupabasePetRepository } from '@features/pets/infrastructure/repositories/SupabasePetRepository';
import { SupabaseAdoptionRepository } from '@features/adoptions/infrastructure/repositories/SupabaseAdoptionRepository';
import { GeminiChatRepository } from '@features/ai-chat/infrastructure/repositories/GeminiChatRepository';
import { SupabaseMapRepository } from '@features/map/infrastructure/repositories/SupabaseMapRepository';

import { LoginUseCase }           from '@features/auth/application/use-cases/LoginUseCase';
import { RegisterUseCase }        from '@features/auth/application/use-cases/RegisterUseCase';
import { LogoutUseCase }          from '@features/auth/application/use-cases/LogoutUseCase';
import { LoginWithGoogleUseCase } from '@features/auth/application/use-cases/LoginWithGoogleUseCase';
import { ForgotPasswordUseCase }  from '@features/auth/application/use-cases/ForgotPasswordUseCase';
import { GetMessagesUseCase }     from '@features/chat/application/use-cases/GetMessagesUseCase';
import { SendMessageUseCase }     from '@features/chat/application/use-cases/SendMessageUseCase';
import { SubscribeToRoomUseCase } from '@features/chat/application/use-cases/SubscribeToRoomUseCase';
import { CreateRoomUseCase }      from '@features/chat/application/use-cases/CreateRoomUseCase';
import { GetPetsUseCase }         from '@features/pets/application/use-cases/GetPetsUseCase';
import { CreatePetUseCase }       from '@features/pets/application/use-cases/CreatePetUseCase';
import { UpdatePetUseCase }       from '@features/pets/application/use-cases/UpdatePetUseCase';
import { DeletePetUseCase }       from '@features/pets/application/use-cases/DeletePetUseCase';
import { CreateAdoptionRequestUseCase } from '@features/adoptions/application/use-cases/CreateAdoptionRequestUseCase';
import { GetAdoptionRequestsUseCase }   from '@features/adoptions/application/use-cases/GetAdoptionRequestsUseCase';
import { UpdateAdoptionStatusUseCase }  from '@features/adoptions/application/use-cases/UpdateAdoptionStatusUseCase';
import { SendAiMessageUseCase }         from '@features/ai-chat/application/use-cases/SendAiMessageUseCase';
import { GetShelterLocationsUseCase }   from '@features/map/application/use-cases/GetShelterLocationsUseCase';

// ── Repositorios ─────────────────────────────────────────────────────────────
export const authRepository     = new SupabaseAuthRepository();
export const chatRepository     = new SupabaseChatRepository();
export const petRepository      = new SupabasePetRepository();
export const adoptionRepository = new SupabaseAdoptionRepository();
export const aiChatRepository   = new GeminiChatRepository();
export const mapRepository      = new SupabaseMapRepository();
// export const authRepository = new AppwriteAuthRepository();
// export const chatRepository = new AppwriteChatRepository();

// ── Use Cases ─────────────────────────────────────────────────────────────────
export const loginUseCase               = new LoginUseCase(authRepository);
export const registerUseCase            = new RegisterUseCase(authRepository);
export const logoutUseCase              = new LogoutUseCase(authRepository);
export const loginWithGoogleUseCase     = new LoginWithGoogleUseCase(authRepository);
export const forgotPasswordUseCase      = new ForgotPasswordUseCase(authRepository);
export const getMessagesUseCase         = new GetMessagesUseCase(chatRepository);
export const sendMessageUseCase         = new SendMessageUseCase(chatRepository);
export const subscribeToRoomUseCase     = new SubscribeToRoomUseCase(chatRepository);
export const createRoomUseCase          = new CreateRoomUseCase(chatRepository);
export const getPetsUseCase             = new GetPetsUseCase(petRepository);
export const createPetUseCase           = new CreatePetUseCase(petRepository);
export const updatePetUseCase           = new UpdatePetUseCase(petRepository);
export const deletePetUseCase           = new DeletePetUseCase(petRepository);
export const createAdoptionRequestUseCase = new CreateAdoptionRequestUseCase(adoptionRepository);
export const getAdoptionRequestsUseCase   = new GetAdoptionRequestsUseCase(adoptionRepository);
export const updateAdoptionStatusUseCase  = new UpdateAdoptionStatusUseCase(adoptionRepository);
export const sendAiMessageUseCase         = new SendAiMessageUseCase(aiChatRepository);
export const getShelterLocationsUseCase   = new GetShelterLocationsUseCase(mapRepository);
