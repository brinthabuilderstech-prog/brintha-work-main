import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Exported so src/lib/firebase-messaging.ts can pass it to getMessaging(app).
export const app = initializeApp(firebaseConfig);

// Offline persistence: Firestore caches reads in IndexedDB and queues writes
// automatically while offline, syncing once the connection returns. This
// replaces the old approach of manually mirroring all app state into
// localStorage on every change (removed from AppContext.tsx) — Firestore's
// own cache is the single source of truth now, both online and offline.
//
// persistentMultipleTabManager lets the cache stay in sync if the user has
// the app open in more than one browser tab at once.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };

  console.error("Firestore Error:", JSON.stringify(errInfo));
}

// Firebase connection test
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("offline")
    ) {
      console.warn(
        "Firebase client appears offline or pending configuration check."
      );
    }
  }
}
