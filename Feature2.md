# Feature: Envío de imágenes en el chat usando Supabase Storage

## Contexto del proyecto
Este es un proyecto React Native con Expo que usa Supabase como backend. El proyecto es una app de chat con salas. El código fuente está en: https://github.com/JuanL525/Mi-Chat_Taller10

## Objetivo
Permitir que los usuarios puedan seleccionar y enviar imágenes desde su galería en el chat. Las imágenes se suben a **Supabase Storage** y se guarda la URL pública en la tabla de mensajes.

---

## Paso 1 – Instalación de dependencias

```bash
npx expo install expo-image-picker expo-file-system
```

---

## Paso 2 – Configurar Supabase Storage

### 2.1 – Crear el bucket en Supabase Dashboard

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. En el menú lateral, ve a **Storage**
3. Haz clic en **New bucket**
4. Nómbralo `chat-images`
5. Marca la opción **Public bucket** (para que las imágenes tengan URL pública accesible)
6. Haz clic en **Save**

### 2.2 – Configurar políticas RLS del bucket

En el dashboard de Supabase, ve a **Storage → Policies** y agrega estas políticas para el bucket `chat-images`:

**Política para subir (INSERT):**
```sql
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');
```

**Política para leer (SELECT):**
```sql
CREATE POLICY "Cualquiera puede ver imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
```

---

## Paso 3 – Agregar columna `image_url` a la tabla de mensajes

En el **SQL Editor** de Supabase, ejecuta:

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
```

> Reemplaza `messages` por el nombre real de tu tabla de mensajes si es diferente.

---

## Paso 4 – Crear el servicio de subida de imágenes

Crea el archivo `src/services/imageService.js`:

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient'; // ajusta la ruta a donde inicializas supabase

/**
 * Abre la galería del dispositivo y devuelve la URI local de la imagen seleccionada.
 * Retorna null si el usuario cancela.
 */
export async function pickImageFromGallery() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Se necesita permiso para acceder a la galería.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7, // comprime un poco para no saturar el storage
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

/**
 * Sube una imagen a Supabase Storage y devuelve la URL pública.
 * @param {string} localUri - URI local de la imagen (de expo-image-picker)
 * @param {string} userId - ID del usuario actual (para organizar archivos)
 * @returns {Promise<string|null>} URL pública o null si falla
 */
export async function uploadImageToSupabase(localUri, userId) {
  try {
    // Leer el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determinar extensión
    const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

    // Nombre único para el archivo
    const fileName = `${userId}/${Date.now()}.${extension}`;

    // Convertir base64 a ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, bytes.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo imagen:', error.message);
      return null;
    }

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.error('Error inesperado al subir imagen:', err);
    return null;
  }
}
```

---

## Paso 5 – Modificar la pantalla de chat para enviar imágenes

Busca el archivo de la pantalla del chat de sala (`ChatRoom.jsx`, `ChatScreen.jsx`, o similar). Haz los siguientes cambios:

### 5.1 – Agregar imports

```javascript
import { pickImageFromGallery, uploadImageToSupabase } from '../services/imageService';
import { Image, TouchableOpacity, ActivityIndicator } from 'react-native';
```

### 5.2 – Agregar estado de carga

```javascript
const [uploadingImage, setUploadingImage] = useState(false);
```

### 5.3 – Agregar la función para enviar imagen

```javascript
const handleSendImage = async () => {
  const localUri = await pickImageFromGallery();
  if (!localUri) return;

  setUploadingImage(true);
  try {
    const imageUrl = await uploadImageToSupabase(localUri, user.id);
    if (!imageUrl) {
      alert('No se pudo subir la imagen. Intenta de nuevo.');
      return;
    }

    // Insertar el mensaje con la imagen en la base de datos
    const { error } = await supabase
      .from('messages')          // ← ajusta al nombre real de tu tabla
      .insert({
        room_id: roomId,         // ← ajusta al nombre real de la columna
        user_id: user.id,        // ← ajusta según tu estructura
        sender_name: user.email, // ← ajusta según tu estructura
        content: '',             // mensaje vacío, la imagen es el contenido
        image_url: imageUrl,     // URL pública de la imagen subida
      });

    if (error) {
      console.error('Error guardando mensaje con imagen:', error.message);
      alert('Error al enviar la imagen.');
    }
  } finally {
    setUploadingImage(false);
  }
};
```

### 5.4 – Agregar botón de imagen en la UI

Cerca del input de texto y el botón de enviar, agrega un botón para abrir la galería:

```jsx
{/* Botón para adjuntar imagen */}
<TouchableOpacity
  onPress={handleSendImage}
  disabled={uploadingImage}
  style={{ padding: 8, marginRight: 4 }}
>
  {uploadingImage
    ? <ActivityIndicator size="small" color="#666" />
    : <Text style={{ fontSize: 22 }}>🖼️</Text>
  }
</TouchableOpacity>
```

### 5.5 – Modificar el renderizado de mensajes

Busca la función/componente que renderiza cada mensaje (puede estar en un `FlatList` con `renderItem`). Agrega soporte para mostrar imágenes:

```jsx
const renderMessage = ({ item }) => (
  <View style={[
    styles.messageBubble,
    item.user_id === user?.id ? styles.myMessage : styles.otherMessage
  ]}>
    {/* Nombre del remitente (si ya lo tienes, mantenlo) */}
    {item.user_id !== user?.id && (
      <Text style={styles.senderName}>{item.sender_name}</Text>
    )}

    {/* Mostrar imagen si el mensaje tiene una */}
    {item.image_url ? (
      <Image
        source={{ uri: item.image_url }}
        style={{
          width: 200,
          height: 200,
          borderRadius: 12,
          resizeMode: 'cover',
        }}
      />
    ) : (
      /* Texto normal */
      <Text style={styles.messageText}>
        {item.content ?? item.text}
      </Text>
    )}

    {/* Timestamp si ya lo tienes */}
    <Text style={styles.timestamp}>
      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  </View>
);
```

---

## Paso 6 – Permisos en app.json

Asegúrate de que `app.json` o `app.config.js` incluya los permisos de galería:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La app necesita acceso a tu galería para enviar imágenes en el chat."
        }
      ]
    ]
  }
}
```

---

## Resumen de archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `src/services/imageService.js` | **Crear** (nuevo) |
| Pantalla de chat (`ChatRoom.jsx` o similar) | **Modificar** – botón de imagen + render de imágenes |
| `app.json` | **Modificar** – agregar plugin de expo-image-picker |
| Supabase Dashboard | **Configurar** – bucket `chat-images` + políticas RLS |
| SQL Editor de Supabase | **Ejecutar** – `ALTER TABLE messages ADD COLUMN image_url TEXT` |

---

## Notas adicionales

- Las imágenes se almacenan en Supabase Storage bajo la ruta `{userId}/{timestamp}.jpg`, lo que evita colisiones de nombres.
- El bucket es público, así que cualquiera con la URL puede ver la imagen. Si necesitas privacidad, cambia a bucket privado y usa URLs firmadas (`createSignedUrl`).
- Si la app ya usa TypeScript, agrega los tipos correspondientes en los parámetros de las funciones.
- La calidad de compresión está en `0.7` (70%) para balancear tamaño y calidad; puedes ajustarla.