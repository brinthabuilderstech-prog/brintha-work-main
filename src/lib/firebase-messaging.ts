// FCM device registration helper.
//
// SETUP REQUIRED before this does anything:
// 1. In your lib/firebase.ts, make sure the initialized app instance is
//    exported, e.g.:
//      export const app = initializeApp(firebaseConfig);
//    (if you only export `db`, add `export { app };` near it)
//
// 2. In the Firebase Console: Project Settings -> Cloud Messaging tab ->
//    "Web configuration" -> generate a "Web Push certificate" (VAPID key).
//    Copy that key into VAPID_KEY below (or an env var — see note at bottom).
//
// 3. public/firebase-messaging-sw.js must exist (provided alongside this
//    file) so the browser can receive pushes while the app/tab is closed.
//
// This file is imported dynamically from AppContext's requestPushPermission,
// so if you haven't done the setup yet, nothing breaks — it just logs a
// warning and the app falls back to foreground-only notifications like before.

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';

// Replace with the "Web Push certificate" key pair from Firebase Console ->
// Project Settings -> Cloud Messaging -> Web configuration.
const VAPID_KEY = 'BP2P34sudwaAbxTAJrcITSQcsmj_HPefoBAllXQ9pqVRI3p76qL_hOk597Y_v5ISQvLXP-nUpIPyTcc6qowsw2I';

export async function registerFcmToken(): Promise<string | null> {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('FCM not supported in this browser/context.');
    return null;
  }

  if (!VAPID_KEY) {
    console.warn('VAPID_KEY not configured in lib/firebase-messaging.ts — skipping FCM registration.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.warn('Failed to register FCM token:', err);
    return null;
  }
}