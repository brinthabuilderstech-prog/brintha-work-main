// netlify/functions/send-push-notification.js
//
// This is the piece that makes notifications work like WhatsApp/Instagram:
// it runs on the SERVER and pushes a real notification to a user's device,
// even if they have the app/tab completely closed.
//
// HOW IT'S TRIGGERED:
// Call this function from wherever an event happens in your app —
// e.g. after saving a new attendance record, after a payment,
// after adding a worker. You can call it directly from your frontend
// (fetch to this endpoint) or from another Netlify function.
//
// SETUP REQUIRED:
// 1. Firebase Console -> Project Settings -> Service Accounts ->
//    "Generate new private key" — this downloads a JSON file.
// 2. In Netlify: Site settings -> Environment variables, add:
//      FIREBASE_SERVICE_ACCOUNT_KEY  = <paste the entire JSON file content as one line>
// 3. npm install firebase-admin --save (in your project root)
// 4. Deploy.
//
// NOTE: This file uses ES Module import/export syntax (not require/exports)
// because the project's package.json has "type": "module" set at the root.

// firebase-admin ships modern, ESM-native subpath exports as of v9+.
// Using these directly (instead of the old "import admin from 'firebase-admin'"
// default-export style) avoids the CJS/ESM interop wrapping issues that were
// causing "Cannot read properties of undefined (reading 'length')".
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin only once (Netlify functions can be reused
// between invocations, so guard against re-initializing)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fcmToken, title, body, data } = JSON.parse(event.body);

    if (!fcmToken || !title || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'fcmToken, title, and body are required' }),
      };
    }

    // This is the actual push — same mechanism WhatsApp/Instagram use.
    // It reaches the device even if the browser is fully closed, as long
    // as the service worker was registered at least once.
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
          // Where the notification click should take the user
          link: data?.link || 'https://brintha-workers.netlify.app/',
        },
      },
      data: data || {},
    };

    const response = await getMessaging().send(message);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response }),
    };
  } catch (err) {
    console.error('Push send failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};