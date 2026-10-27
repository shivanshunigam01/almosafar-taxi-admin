import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";
import type { FirebaseClientConfig } from "../data/config";

const DEFAULT_APP = "almosafar";

export interface FirebaseClientBundle {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
}

export function getOrInitFirebaseClient(
  config: FirebaseClientConfig,
  appName = DEFAULT_APP
): FirebaseClientBundle {
  const app =
    getApps().find((a) => a.name === appName) ??
    initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      appName
    );

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    functions: getFunctions(app, "us-central1"),
  };
}

export function getExistingFirebaseClient(appName = DEFAULT_APP): FirebaseClientBundle | null {
  try {
    const app = getApp(appName);
    return {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      functions: getFunctions(app, "us-central1"),
    };
  } catch {
    return null;
  }
}
