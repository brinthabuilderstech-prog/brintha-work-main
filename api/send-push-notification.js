// /api/send-push-notification.js

import admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing = [];

  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variable(s): ${missing.join(', ')}`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return admin;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);

    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const firebaseAdmin = getFirebaseAdmin();

    const {
      fcmToken,
      title,
      body,
      data,
    } = req.body || {};

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({
        error: 'fcmToken is required',
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        error: 'title is required',
      });
    }

    if (!body || typeof body !== 'string') {
      return res.status(400).json({
        error: 'body is required',
      });
    }

    let stringData;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      stringData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          String(value),
        ])
      );
    }

    const message = {
      token: fcmToken,

      notification: {
        title,
        body,
      },

      ...(stringData && {
        data: stringData,
      }),

      webpush: {
        fcmOptions: {
          link:
            data &&
            typeof data === 'object' &&
            typeof data.link === 'string'
              ? data.link
              : '/',
        },
      },
    };

    const messageId = await firebaseAdmin
      .messaging()
      .send(message);

    return res.status(200).json({
      success: true,
      messageId,
    });

  } catch (error) {
    console.error('FCM send error:', error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send push notification',
    });
  }
}