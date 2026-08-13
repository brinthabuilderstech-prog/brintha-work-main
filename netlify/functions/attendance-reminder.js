// Netlify Scheduled Function — runs automatically on the cron below,
// no GitHub Actions or extra hosting needed. Netlify's free tier includes
// scheduled functions.
//
// SETUP REQUIRED (in Netlify dashboard -> Site settings -> Environment variables):
//   FIREBASE_SERVICE_ACCOUNT_KEY = the full contents of the JSON key file you
//     download from Firebase Console -> Project Settings -> Service Accounts
//     -> "Generate new private key". Paste the whole JSON as a single-line
//     string value.
//
// Also run: npm install firebase-admin @netlify/functions --save
// (in your project root, so Netlify installs it during build)
//
// Cron below is "30 3 * * *" = 3:30 AM UTC = 9:00 AM IST. Adjust if your
// site works in a different timezone — Netlify cron is always UTC.

const { schedule } = require('@netlify/functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function todayDateString() {
  // Matches the same YYYY-MM-DD format your app's getDateOffset(0) produces.
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const handler = async () => {
  const today = todayDateString();

  // 1. Find who has already been marked today.
  const attendanceSnap = await db.collection('attendance').where('date', '==', today).get();
  const markedWorkerIds = new Set(attendanceSnap.docs.map((d) => d.data().workerId));

  // 2. Find supervisors/admins — they're the ones who need the "mark
  // attendance" reminder, not the workers themselves.
  const usersSnap = await db.collection('users').get();
  const staff = usersSnap.docs
    .map((d) => d.data())
    .filter((u) => u.role === 'admin' || u.role === 'supervisor');

  const totalWorkers = usersSnap.docs.filter((d) => d.data().role === 'worker').length;
  const unmarkedCount = totalWorkers - markedWorkerIds.size;

  if (unmarkedCount <= 0) {
    console.log('All workers already marked today — no reminder needed.');
    return { statusCode: 200, body: 'No reminder needed' };
  }

  // 3. Collect FCM tokens for staff who have registered a device
  // (written to users/{id}.fcmTokens by lib/firebase-messaging.ts).
  const tokens = staff.flatMap((u) => u.fcmTokens || []);

  if (tokens.length === 0) {
    console.log('No staff FCM tokens registered yet — nothing to send.');
    return { statusCode: 200, body: 'No tokens registered' };
  }

  const message = {
    notification: {
      title: 'Attendance Reminder',
      body: `${unmarkedCount} worker${unmarkedCount === 1 ? '' : 's'} not marked yet today. Tap to mark attendance.`,
    },
    tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(`Sent ${response.successCount}/${tokens.length} reminder pushes.`);

  return { statusCode: 200, body: `Sent ${response.successCount}/${tokens.length}` };
};

exports.handler = schedule('30 3 * * *', handler);
