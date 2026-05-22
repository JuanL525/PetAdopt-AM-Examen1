# Feature: Notificaciones de mensajes no leídos con expo-notifications

## Contexto del proyecto
Este es un proyecto React Native con Expo que usa Supabase como backend (base de datos + realtime). El proyecto es una app de chat con salas. El código fuente está en: https://github.com/JuanL525/Mi-Chat_Taller10

## Objetivo
Implementar notificaciones locales con `expo-notifications` de modo que cuando alguien envíe un mensaje en una sala de chat, los demás usuarios (que estén en otra pantalla o con la app en segundo plano) reciban una notificación de "mensaje sin leer".

---

## Paso 1 – Instalación de dependencias

Ejecuta en la raíz del proyecto:

```bash
npx expo install expo-notifications expo-device expo-constants
```

> ⚠️ **Viabilidad**: Las notificaciones **locales** funcionan perfectamente en **Expo Go** sin necesidad de generar un APK. Las notificaciones **push remotas** (enviadas desde servidor) sí requieren un build nativo (APK/EAS Build). Para este caso usaremos notificaciones locales disparadas desde el cliente con Supabase Realtime, lo cual funciona en Expo Go.

---

## Paso 2 – Crear el servicio de notificaciones

Crea el archivo `src/services/notificationService.js` (o `.ts` si el proyecto usa TypeScript) con el siguiente contenido:

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configuración de cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificación al usuario.
 * Llama esta función al iniciar la app (en el componente raíz o en el login).
 */
export async function registerForNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn('Las notificaciones solo funcionan en dispositivos físicos o emuladores con soporte.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permiso de notificaciones denegado.');
    return null;
  }

  return finalStatus;
}

/**
 * Dispara una notificación local inmediata.
 * @param {string} senderName - Nombre del usuario que envió el mensaje
 * @param {string} roomName - Nombre de la sala donde se envió
 * @param {string} messagePreview - Texto breve del mensaje
 */
export async function sendMessageNotification(senderName, roomName, messagePreview) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💬 ${senderName} en ${roomName}`,
      body: messagePreview.length > 60 ? messagePreview.substring(0, 60) + '...' : messagePreview,
      sound: true,
      badge: 1,
      data: { roomName },
    },
    trigger: null, // null = mostrar inmediatamente
  });
}
```

---

## Paso 3 – Solicitar permisos al iniciar la app

Busca el archivo raíz de la app (probablemente `App.js`, `app/_layout.jsx`, o similar). Agrega la solicitud de permisos al montar el componente:

```javascript
// Agrega este import al inicio del archivo raíz
import { registerForNotificationsAsync } from './src/services/notificationService';
import { useEffect } from 'react';

// Dentro del componente principal, agrega:
useEffect(() => {
  registerForNotificationsAsync();
}, []);
```

---

## Paso 4 – Disparar la notificación desde la sala de chat

Busca el archivo de la pantalla/componente del **chat de sala** (puede llamarse `ChatRoom.jsx`, `ChatScreen.jsx`, `Room.jsx`, o similar). En ese componente ya debería existir una suscripción de Supabase Realtime que escucha mensajes nuevos. Modifícala así:

### Antes (ejemplo de cómo probablemente luce la suscripción):
```javascript
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`,
  }, (payload) => {
    setMessages((prev) => [...prev, payload.new]);
  })
  .subscribe();
```

### Después (agrega la notificación cuando el mensaje no es del usuario actual):
```javascript
import { sendMessageNotification } from '../services/notificationService';
import { useAuth } from '../context/AuthContext'; // ajusta la ruta según tu proyecto

// Dentro del componente, obtén el usuario actual:
const { user } = useAuth(); // o como obtengas el usuario logueado en tu proyecto

// Modifica el handler del canal:
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',           // ← ajusta al nombre real de tu tabla
    filter: `room_id=eq.${roomId}`, // ← ajusta al nombre real de la columna
  }, (payload) => {
    const newMessage = payload.new;

    // Agrega el mensaje a la lista local
    setMessages((prev) => [...prev, newMessage]);

    // Solo notifica si el mensaje NO lo escribió el usuario actual
    // y si la app está en segundo plano o en otra pantalla
    if (newMessage.user_id !== user?.id) {
      sendMessageNotification(
        newMessage.sender_name ?? 'Alguien',  // ajusta al campo real del remitente
        roomName,                              // el nombre de la sala (prop o estado local)
        newMessage.content ?? newMessage.text ?? '(mensaje nuevo)', // ajusta al campo real del texto
      );
    }
  })
  .subscribe();
```

> ⚠️ **Importante**: Ajusta los nombres de campos (`room_id`, `user_id`, `sender_name`, `content`, tabla `messages`) a los que realmente uses en tu base de datos Supabase. Revisa tus tablas en el dashboard de Supabase para confirmarlos.

---

## Paso 5 – (Opcional) Manejar tap en la notificación para navegar a la sala

Agrega esto en el componente raíz si quieres que al tocar la notificación se abra la sala correspondiente:

```javascript
import * as Notifications from 'expo-notifications';
import { useNavigationContainerRef } from '@react-navigation/native'; // si usas React Navigation

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const roomName = response.notification.request.content.data?.roomName;
    if (roomName) {
      // Navega a la sala — ajusta según tu estructura de navegación
      navigation.navigate('ChatRoom', { roomName });
    }
  });
  return () => subscription.remove();
}, []);
```

---

## Resumen de archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `src/services/notificationService.js` | **Crear** (nuevo) |
| `App.js` o `app/_layout.jsx` | **Modificar** – agregar `registerForNotificationsAsync()` |
| Pantalla de chat de sala (`ChatRoom.jsx` o similar) | **Modificar** – disparar notificación en el listener de Realtime |

---

## Notas de viabilidad

- ✅ **Expo Go**: Funciona para notificaciones locales (este enfoque).
- ✅ **APK (EAS Build)**: También funciona, y además habilitaría notificaciones push remotas.
- ❌ **Push remotas en Expo Go**: Limitado; requeriría configurar un servidor con Expo Push API.
- Para este taller, el enfoque de notificaciones locales disparadas por Realtime es suficiente y funciona en Expo Go.