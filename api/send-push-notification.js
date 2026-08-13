// /api/send-push-notification.js
// Vercel serverless function (Node runtime) that sends a push notification
// via Firebase Cloud Messaging using the Firebase Admin SDK.

import admin from 'firebase-admin';

// Initialize the Admin SDK once (Vercel can reuse the same process
// across invocations, so guard against re-initializing).
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel env vars store newlines as literal "\n" — convert them back.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fcmToken, title, body, data } = req.body || {};

  if (!fcmToken || !title || !body) {
    return res.status(400).json({ error: 'fcmToken, title, and body are required' });
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      // FCM data payloads must be string-only key/value pairs.
      data: data
        ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
        : undefined,
      webpush: {
        fcmOptions: {
          link: data?.link || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('FCM send error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send push notification' });
  }
}