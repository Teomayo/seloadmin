import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  query,
  limit,
  getDocs,
} from "firebase/firestore";

// Log the environment and API key (remove in production)
console.log("Environment Mode:", process.env.REACT_APP_ENV_MODE);
console.log(
  "Firebase API Key:",
  process.env.REACT_APP_FIREBASE_API_KEY?.substring(0, 5) + "..."
);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate required configuration
const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingConfig = requiredConfig.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);
if (missingConfig.length > 0) {
  throw new Error(
    `Missing required Firebase configuration: ${missingConfig.join(", ")}`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Enable persistent auth state
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Connect to emulators in development mode
if (process.env.REACT_APP_ENV_MODE === "development") {
  console.log("Connecting to Firebase emulators...");
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8000);
  } catch (error) {
    console.error("Error connecting to emulators:", error);
  }
} else {
  console.log("Connecting to Firebase production services...");
  // Verify production connection
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Successfully connected to Firebase Auth (Production)");
    }
  });

  // Test Firestore connection using v9 syntax
  const testQuery = query(collection(db, "users"), limit(1));
  getDocs(testQuery)
    .then(() => {
      console.log("Successfully connected to Firestore (Production)");
    })
    .catch((error) => {
      console.error("Error connecting to Firestore:", error);
    });
}

// Export initialized services
export { auth, db };
export default app;
