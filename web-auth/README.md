# PetAdopt Web Auth

Sitio web auxiliar para confirmación de cuenta y reseteo de contraseña.

## Despliegue en Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Desde esta carpeta: `vercel --prod`
3. Copia la URL generada (ej. `https://petadopt-auth.vercel.app`)

## Configurar en Supabase

1. Ve a **Supabase Dashboard → Authentication → URL Configuration**
2. **Site URL**: `https://tu-url.vercel.app`
3. **Redirect URLs** — agrega **todas** estas líneas:
   - `https://tu-url.vercel.app`
   - `https://tu-url.vercel.app/**`
   - `https://tu-url.vercel.app/?type=recovery`
   - `michatapp://**`
4. **Authentication → Email Templates → Reset Password** — el enlace debe usar `{{ .ConfirmationURL }}`
5. (Opcional) **Authentication → Providers → Email** — sube "Mailer OTP Expiration" a `86400` (24 h) para pruebas

## Plantilla del correo de recuperación

**No hay plantilla de email en este repositorio.** El contenido del correo lo define **Supabase**, no Vercel ni la app móvil.

| Quién | Qué hace |
|-------|----------|
| **Tu app** (`SupabaseAuthRepository.ts`) | Solo pide el envío con `resetPasswordForEmail` y la URL de redirect |
| **Supabase** | Genera el enlace con token y usa la plantilla de **Email Templates** |
| **Resend** | Solo entrega el correo (SMTP); **no escribe el texto** |

### Editar la plantilla (español, diseño propio)

1. [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto
2. **Authentication** → **Email Templates**
3. Elige **Reset Password**
4. Copia el HTML de referencia desde `web-auth/email-templates/reset-password.html`
5. Pega en el cuerpo del template
6. Asunto sugerido: `Restablece tu contraseña · PetAdopt`
7. **Save**

Debes conservar `{{ .ConfirmationURL }}` en el enlace — sin eso el reset falla o expira mal.

Si el correo llega en inglés y muy simple, es la **plantilla por defecto de Supabase** (no personalizaste aún).

## Variables

Edita `index.html` y reemplaza:
- `REEMPLAZA_CON_TU_SUPABASE_URL` → tu URL de Supabase
- `REEMPLAZA_CON_TU_SUPABASE_ANON_KEY` → tu anon key
