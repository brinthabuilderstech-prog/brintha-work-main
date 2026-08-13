// This file must be served from your site's ROOT (e.g. https://yourapp.com/firebase-messaging-sw.js),
// which is why it lives in /public — both Vite and CRA-style builds copy
// everything in /public to the root of the deployed site untouched.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Fill this in with the SAME config object you use in lib/firebase.ts.
// (Service workers can't import your app's modules, so it has to be
// duplicated here — these values are public/safe to expose, they're not secrets.)
firebase.initializeApp({
  apiKey: 'AIzaSyDIG4K6H2iJiVy2eg4lDwhPtvVTskyj--w',
  authDomain: 'brintha-workers-b9fb5.firebaseapp.com',
  projectId: 'brintha-workers-b9fb5',
  storageBucket: 'brintha-workers-b9fb5.firebasestorage.app',
  messagingSenderId: '145436088092',
  appId: '1:145436088092:web:0c1dc362c1976f4fc48cd9',
});

const messaging = firebase.messaging();

// Fires when a push arrives while the app is closed / not focused.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'LaborTrack';
  const body = payload.notification?.body || payload.data?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
  });
});
