// src/lib/send-notification.ts

import { getFcmToken } from './firebase-messaging';

export async function sendTestNotification() {
  const fcmToken = await getFcmToken();
  console.log('Frontend FCM token:', fcmToken);

  if (!fcmToken || typeof fcmToken !== 'string') {
    console.warn('Cannot send notification: no valid FCM token');
    return;
  }

  try {
    const res = await fetch('/api/send-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken,
        title: 'Test notification',
        body: 'This is a test message from the app.',
        data: {
          link: '/',
          linkModule: 'dashboard',
        },
      }),
    });

    const json = await res.json();
    console.log('API response:', json);
  } catch (error) {
    console.error('Frontend send error:', error);
  }
}