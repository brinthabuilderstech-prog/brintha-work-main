import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function getFirebaseAdminApp() {
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
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

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    console.log('Raw req.body:', req.body);

    const app = getFirebaseAdminApp();

    const {
      fcmToken,
      title,
      body,
      data = {},
    } = req.body || {};

    console.log('Parsed fields:', {
      hasToken: !!fcmToken,
      title,
      body,
      data,
    });

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'fcmToken is required',
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'title is required',
      });
    }

    if (!body || typeof body !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'body is required',
      });
    }

    const stringData = {};

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, value] of Object.entries(data)) {
        stringData[key] = String(value);
      }
    }

    const appUrl = 'https://brintha-work-main.vercel.app';

    const message = {
      token: fcmToken,

      notification: {
        title,
        body,
      },

      data: stringData,

      webpush: {
        fcmOptions: {
          link: appUrl,
        },
      },
    };

    console.log('Sending FCM message...');

    const messageId = await getMessaging(app).send(message);

    console.log('FCM message sent:', messageId);

    return res.status(200).json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('FCM send error full:', error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send push notification',
    });
  }
}