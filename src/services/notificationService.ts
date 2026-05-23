import * as Device from 'expo-device';
import Constants from 'expo-constants';

let NotificationsModule: typeof import('expo-notifications') | null = null;

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
  // Evitamos cargar expo-notifications en Expo Go para prevenir errores ruidosos de compatibilidad
  if (Constants.appOwnership === 'expo') {
    return null;
  }

  if (!NotificationsModule) {
    try {
      const mod = await import('expo-notifications');
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      NotificationsModule = mod;
    } catch (err) {
      console.warn('expo-notifications not available:', err);
      return null;
    }
  }
  return NotificationsModule;
}

export async function registerForNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.warn('Notifications: not a physical device, skipping permissions');
      return null;
    }

    const Notifications = await getNotifications();
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notifications permission not granted');
      return null;
    }

    return finalStatus;
  } catch (err) {
    console.warn('registerForNotificationsAsync error', err);
    return null;
  }
}

export async function sendMessageNotification(
  senderName: string,
  roomId: string,
  messagePreview: string,
) {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${senderName}`,
        body: messagePreview.length > 120 ? messagePreview.slice(0, 120) + '...' : messagePreview,
        data: { roomId },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('sendMessageNotification error', err);
  }
}

export async function getExpoNotifications() {
  return getNotifications();
}
