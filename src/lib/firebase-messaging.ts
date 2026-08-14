// src/lib/firebase-messaging.ts

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';

export async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase messaging is not supported in this browser.');
    return null;
  }
  return getMessaging(app);
}

export async function getFcmToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  // From Firebase Console → Cloud Messaging → Web push certificates
  const vapidKey = 'BKYkYhkGo9UlohdopU-YSm-GDWExuWxprzr_r6WVPHjLpMioBubXnrtCUOp0OQ-QZpWJGTtZe3dH-4uKS4LvUdE';

  try {
    const token = await getToken(messaging, { vapidKey });
    console.log('Got FCM token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}