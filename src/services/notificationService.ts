import { Platform } from 'react-native';

let NotificationsModule: typeof import('expo-notifications') | null = null;

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
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

async function ensureAndroidChannel(Notifications: typeof import('expo-notifications')) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'PetAdopt',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF5533',
    sound: 'default',
  });
}

export async function registerForNotificationsAsync() {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return null;

    await ensureAndroidChannel(Notifications);

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

/** Notificación local inmediata (Supabase Realtime → scheduleNotificationAsync) */
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

export async function sendAdoptionNotification(
  title: string,
  body: string,
  requestId: string,
) {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { requestId },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('sendAdoptionNotification error', err);
  }
}

export async function getExpoNotifications() {
  return getNotifications();
}
