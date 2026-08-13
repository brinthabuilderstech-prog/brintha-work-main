// api/send-push-notification.js
//
// Vercel serverless function — sends a real push notification via Firebase
// Admin SDK, the same mechanism WhatsApp/Instagram use server-side. Reaches
// the device even if the app/tab is completely closed.
//
// HOW IT'S TRIGGERED:
// Called from AppContext.tsx (fetch to /api/send-push-notification) whenever
// a real event happens — attendance marked, payment cleared, advance issued.
//
// SETUP REQUIRED:
// 1. Firebase Console -> Project Settings -> Service Accounts ->
//    "Generate new private key" — downloads a JSON file.
// 2. In Vercel: Project Settings -> Environment Variables, add:
//      FIREBASE_SERVICE_ACCOUNT_KEY = <paste the entire JSON file content as one line>
//    (Add it for Production, Preview, and Development environments.)
// 3. npm install firebase-admin --save (already installed from Netlify setup)
// 4. Deploy.
//
// Uses firebase-admin's modular subpath imports (firebase-admin/app,
// firebase-admin/messaging) since these are proper ESM exports and avoid
// the CJS/ESM interop wrapping issues the old default-export style had.

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fcmToken, title, body, data } = req.body;

    if (!fcmToken || !title || !body) {
      return res.status(400).json({ error: 'fcmToken, title, and body are required' });
    }

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: data?.link || 'https://brintha-workers.netlify.app/',
        },
      },
      data: data || {},
    };

    const response = await getMessaging().send(message);

    return res.status(200).json({ success: true, messageId: response });
  } catch (err) {
    console.error('Push send failed:', err);
    return res.status(500).json({ error: err.message, code: err.code || null });
  }
}
