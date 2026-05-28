import { SupabaseAuthRepository } from '@features/auth/infrastructure/repositories/SupabaseAuthRepository';
import { SupabaseChatRepository } from '@features/chat/infrastructure/repositories/SupabaseChatRepository';
import { AppwriteAuthRepository } from '@features/auth/infrastructure/repositories/AppwriteAuthRepository';
import { AppwriteChatRepository } from '@features/chat/infrastructure/repositories/AppwriteChatRepository';

import { LoginUseCase }           from '@features/auth/application/use-cases/LoginUseCase';
import { RegisterUseCase }        from '@features/auth/application/use-cases/RegisterUseCase';
import { LogoutUseCase }          from '@features/auth/application/use-cases/LogoutUseCase';
import { LoginWithGoogleUseCase } from '@features/auth/application/use-cases/LoginWithGoogleUseCase';
import { GetMessagesUseCase }     from '@features/chat/application/use-cases/GetMessagesUseCase';
import { SendMessageUseCase }     from '@features/chat/application/use-cases/SendMessageUseCase';
import { SubscribeToRoomUseCase } from '@features/chat/application/use-cases/SubscribeToRoomUseCase';
import { CreateRoomUseCase }      from '@features/chat/application/use-cases/CreateRoomUseCase';

// ── Repositorios (intercambiables) ───────────────────────────────────────────
export const authRepository = new SupabaseAuthRepository();
export const chatRepository = new SupabaseChatRepository();
// export const authRepository = new AppwriteAuthRepository();
// export const chatRepository = new AppwriteChatRepository();

// ── Use cases (no cambian al migrar) ─────────────────────────────────────────
export const loginUseCase           = new LoginUseCase(authRepository);
export const registerUseCase        = new RegisterUseCase(authRepository);
export const getMessagesUseCase     = new GetMessagesUseCase(chatRepository);
export const sendMessageUseCase     = new SendMessageUseCase(chatRepository);
export const subscribeToRoomUseCase = new SubscribeToRoomUseCase(chatRepository);
export const createRoomUseCase      = new CreateRoomUseCase(chatRepository);
export const logoutUseCase          = new LogoutUseCase(authRepository);
export const loginWithGoogleUseCase = new LoginWithGoogleUseCase(authRepository);
