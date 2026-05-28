import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { sha256 } from 'js-sha256';

// ============================================================================
// Polyfill para la API de WebCrypto (Requerido para PKCE S256 en Supabase)
//
// PROBLEMA: El motor de JavaScript Hermes en React Native/Expo no proporciona
// la especificación completa de WebCrypto (como crypto.subtle.digest y getRandomValues).
//
// SOLUCIÓN:
// 1. Polyfilleamos 'crypto.getRandomValues' usando la versión oficial compatible
//    de 'expo-crypto' (instalada vía 'npx expo install' para evitar conflictos).
// 2. Polyfilleamos 'crypto.subtle.digest' usando la librería pura JS
//    'js-sha256' para garantizar máxima estabilidad y compatibilidad.
// ============================================================================

if (typeof global.crypto === 'undefined') {
  global.crypto = {} as any;
}

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = global.crypto;
}

if (!global.crypto.getRandomValues) {
  Object.defineProperty(global.crypto, 'getRandomValues', {
    value: Crypto.getRandomValues,
    writable: true,
    configurable: true,
  });
}

if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: {
      digest: async (algorithm: string, data: ArrayBufferView | ArrayBuffer): Promise<ArrayBuffer> => {
        const algo = algorithm.toUpperCase();
        if (algo !== 'SHA-256' && algo !== 'SHA256') {
          throw new Error(`Unsupported digest algorithm: ${algorithm}. Only SHA-256 is supported by this pure JS polyfill.`);
        }

        // Convertir ArrayBuffer / ArrayBufferView a Uint8Array compatible con js-sha256
        let bytes: Uint8Array | ArrayBuffer;
        if (ArrayBuffer.isView(data)) {
          bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else {
          bytes = data;
        }

        // Obtener el hash en formato ArrayBuffer
        const hashArrayBuffer = sha256.arrayBuffer(bytes);
        return hashArrayBuffer;
      }
    },
    writable: true,
    configurable: true,
  });
}

// ============================================================================
// Adaptador de almacenamiento híbrido: Memoria + SecureStore
//
// PROBLEMA: expo-secure-store en Expo Go puede colgarse indefinidamente
// cuando los valores superan ~2048 bytes (JWTs de Supabase).
// Esto bloquea los locks internos del cliente Supabase y cuelga toda
// la autenticación.
//
// SOLUCIÓN: Usar un Map de JavaScript como almacenamiento primario (instantáneo,
// nunca se cuelga) y SecureStore como respaldo persistente (best-effort).
// - setItem: guarda en memoria inmediatamente + intenta SecureStore en background
// - getItem: lee de memoria primero, luego de SecureStore como fallback
// - removeItem: borra de ambos
// ============================================================================

const memoryCache = new Map<string, string>();
const STORE_TIMEOUT = 2000; // Timeout para operaciones de SecureStore

/**
 * Ejecuta una operación de SecureStore con timeout.
 * Si la operación se cuelga, resuelve con el fallback (no lanza error).
 */
function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), STORE_TIMEOUT)),
  ]).catch(() => fallback);
}

export const HybridStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    console.log(`[StorageAdapter] getItem called for key: ${key}`);
    // 1. Buscar en memoria (siempre disponible, instantáneo)
    const cached = memoryCache.get(key);
    if (cached !== undefined) {
      console.log(`[StorageAdapter] getItem hit in memory for key: ${key}. Value: ${cached.substring(0, 15)}...`);
      return cached;
    }

    // 2. Fallback: buscar en SecureStore (fragmentado o normal, secuencialmente)
    try {
      console.log(`[StorageAdapter] Checking if ${key} is chunked...`);
      const chunksCountStr = await withTimeout(SecureStore.getItemAsync(`${key}.chunks`), null);
      
      if (chunksCountStr !== null) {
        const numChunks = parseInt(chunksCountStr, 10);
        console.log(`[StorageAdapter] ${key} is chunked into ${numChunks} pieces. Reading chunks sequentially...`);
        
        const chunks: (string | null)[] = [];
        for (let i = 0; i < numChunks; i++) {
          const chunk = await withTimeout(SecureStore.getItemAsync(`${key}.chunk.${i}`), null);
          chunks.push(chunk);
        }
        
        // Si falta algún fragmento, la lectura está incompleta, retornamos null
        if (chunks.some(c => c === null)) {
          console.warn(`[StorageAdapter] Some chunks are missing for key: ${key}`);
          return null;
        }
        
        const stitched = chunks.join('');
        console.log(`[StorageAdapter] Stitched ${numChunks} chunks successfully.`);
        memoryCache.set(key, stitched); // Cachear
        return stitched;
      }

      // No está fragmentado, leer de forma normal
      console.log(`[StorageAdapter] ${key} is not chunked. Reading normal key...`);
      const stored = await withTimeout(SecureStore.getItemAsync(key), null);
      if (stored !== null) {
        console.log(`[StorageAdapter] getItem hit in SecureStore for normal key: ${key}`);
        memoryCache.set(key, stored); // Cachear
        return stored;
      }
    } catch (e) {
      console.warn('[Storage] SecureStore getItem error:', key, e);
    }

    console.log(`[StorageAdapter] getItem returned null for key: ${key}`);
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    console.log(`[StorageAdapter] setItem called for key: ${key}, value preview: ${value.substring(0, 20)}...`);
    // 1. Guardar en memoria INMEDIATAMENTE (nunca falla)
    memoryCache.set(key, value);

    // 2. Persistir en SecureStore secuencialmente para evitar deadlocks en el puente nativo
    try {
      const CHUNK_SIZE = 1024;
      if (value.length > CHUNK_SIZE) {
        console.log(`[StorageAdapter] setItem value is large (${value.length} bytes). Splitting into chunks...`);
        const numChunks = Math.ceil(value.length / CHUNK_SIZE);
        
        // Guardar cada fragmento secuencialmente
        for (let i = 0; i < numChunks; i++) {
          const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await withTimeout(SecureStore.setItemAsync(`${key}.chunk.${i}`, chunk), undefined);
        }
        
        // Guardar número de fragmentos y borrar llave principal secuencialmente
        await withTimeout(SecureStore.setItemAsync(`${key}.chunks`, String(numChunks)), undefined);
        await withTimeout(SecureStore.deleteItemAsync(key), undefined);
        
        console.log(`[StorageAdapter] setItem successfully stored large value in ${numChunks} chunks.`);
      } else {
        // Guardar de forma normal y borrar rastros de fragmentos anteriores secuencialmente
        await withTimeout(SecureStore.setItemAsync(key, value), undefined);
        await withTimeout(SecureStore.deleteItemAsync(`${key}.chunks`), undefined);
        console.log(`[StorageAdapter] setItem successfully stored small value.`);
      }
    } catch (e) {
      console.warn(`[StorageAdapter] SecureStore setItem error for key: ${key}:`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    console.log(`[StorageAdapter] removeItem called for key: ${key}`);
    // 1. Borrar de memoria
    memoryCache.delete(key);

    // 2. Borrar de SecureStore secuencialmente (incluyendo cualquier fragmento potencial)
    try {
      const chunksCountStr = await withTimeout(SecureStore.getItemAsync(`${key}.chunks`), null);
      
      await withTimeout(SecureStore.deleteItemAsync(key), undefined);
      await withTimeout(SecureStore.deleteItemAsync(`${key}.chunks`), undefined);
      
      if (chunksCountStr !== null) {
        const numChunks = parseInt(chunksCountStr, 10);
        for (let i = 0; i < numChunks; i++) {
          await withTimeout(SecureStore.deleteItemAsync(`${key}.chunk.${i}`), undefined);
        }
      }
      
      console.log(`[StorageAdapter] removeItem successfully deleted all traces of ${key}`);
    } catch (e) {
      console.warn(`[StorageAdapter] SecureStore removeItem error for key: ${key}:`, e);
    }
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: HybridStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);