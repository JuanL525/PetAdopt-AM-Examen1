-- =============================================================================
-- PetAdopt — Push notifications (2do plano / app cerrada)
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- 1. Columna para guardar el token Expo Push de cada usuario
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. Política: cada usuario puede actualizar su propio token
DROP POLICY IF EXISTS "Users update own push token" ON profiles;
CREATE POLICY "Users update own push token"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 3. Desplegar Edge Function (en tu PC, con Supabase CLI):
--
--    npm i -g supabase
--    supabase login
--    supabase link --project-ref xjagectkljlgkhxxmjnu
--    supabase functions deploy push-notify --no-verify-jwt
--
-- 4. Configurar Database Webhooks en Supabase Dashboard:
--    Database → Webhooks → Create a new hook
--
--    Webhook A — Mensajes de chat
--    ─────────────────────────────
--    Name:     push-on-message
--    Table:    messages
--    Events:   INSERT
--    Type:     Supabase Edge Function
--    Function: push-notify
--
--    Webhook B — Nueva solicitud de adopción
--    ───────────────────────────────────────
--    Name:     push-on-adoption-insert
--    Table:    adoption_requests
--    Events:   INSERT
--    Function: push-notify
--
--    Webhook C — Cambio de estado de adopción
--    ─────────────────────────────────────────
--    Name:     push-on-adoption-update
--    Table:    adoption_requests
--    Events:   UPDATE
--    Function: push-notify
--
-- 5. Rebuild APK (obligatorio — FCM se configura en el build de EAS):
--    eas build -p android --profile preview
--
-- 6. En cada dispositivo: abrir la app, aceptar permiso de notificaciones,
--    iniciar sesión (registra el token automáticamente).
-- =============================================================================
