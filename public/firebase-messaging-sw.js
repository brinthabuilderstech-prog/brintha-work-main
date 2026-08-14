// public/firebase-messaging-sw.js
// This MUST be a real service worker file (no ES module imports, no Node.js code).
// It handles background push messages when the app tab is closed/not focused.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDIG4K6H2iJiVy2eg4lDwhPtvVTskyj--w',
  authDomain: 'brintha-workers-b9fb5.firebaseapp.com',
  projectId: 'brintha-workers-b9fb5',
  storageBucket: 'brintha-workers-b9fb5.firebasestorage.app',
  messagingSenderId: '145436088092',
  appId: '1:145436088092:web:0c1dc362c1976f4fc48cd9',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'LaborTrack';
  const body = payload.notification?.body || payload.data?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
  });
});