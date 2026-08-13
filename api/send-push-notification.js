// api/send-push-notification.js
//
// Vercel-compatible version of the Netlify function.
// Same logic, adapted to Vercel's (req, res) handler signature.
//
// SETUP REQUIRED (same as before):
// 1. Firebase Console -> Project Settings -> Service Accounts ->
//    "Generate new private key" — this downloads a JSON file.
// 2. In Vercel: Project Settings -> Environment Variables, add:
//      FIREBASE_SERVICE_ACCOUNT_KEY = <paste the entire JSON file content as one line>
// 3. npm install firebase-admin --save (in your project root, if not already installed)
// 4. Deploy.
//
// NOTE: File must live at /api/send-push-notification.js (Vercel's convention —
// any file under /api automatically becomes an endpoint at /api/<filename>).

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin only once (serverless functions can be reused
// between invocations, so guard against re-initializing)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Vercel automatically parses JSON bodies into req.body — no need to
    // JSON.parse(event.body) like on Netlify.
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
    return res.status(500).json({ error: err.message });
  }
}
