import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForNotificationsAsync() {
  if (!Device.isDevice) {
    console.warn('Las notificaciones locales funcionan mejor en un dispositivo físico.');
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

export async function sendMessageNotification(
  senderName: string,
  roomName: string,
  messagePreview: string,
) {
  const body =
    messagePreview.length > 60
      ? `${messagePreview.substring(0, 60)}...`
      : messagePreview;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💬 ${senderName} en ${roomName}`,
      body: body || 'Nuevo mensaje',
      sound: true,
      badge: 1,
      data: { roomName },
    },
    trigger: null,
  });
}
