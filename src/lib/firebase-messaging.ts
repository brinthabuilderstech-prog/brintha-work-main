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

  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser.');
    return null;
  }

  // Use the SAME service worker (sw.js) that's already registered for the
  // whole app (it has Firebase Messaging merged into it). Passing this
  // explicitly stops the Firebase SDK from auto-registering a second,
  // separate firebase-messaging-sw.js at the same scope, which caused a
  // scope conflict and stale/unregistered push subscriptions.
  const swRegistration = await navigator.serviceWorker.ready;

  // From Firebase Console → Cloud Messaging → Web push certificates
  const vapidKey = 'BKYkYhkGo9UlohdopU-YSm-GDWExuWxprzr_r6WVPHjLpMioBubXnrtCUOp0OQ-QZpWJGTtZe3dH-4uKS4LvUdE';

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });
    console.log('Got FCM token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}