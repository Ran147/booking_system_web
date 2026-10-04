// Ports match firebase.json. The demo- project id lets the Emulator Suite run
// offline when .env.local has no Firebase values.
export const FIREBASE_EMULATOR = {
  AUTH_URL: "http://127.0.0.1:9099",
  DEMO_API_KEY: "demo-api-key",
  DEMO_PROJECT_ID: "demo-booking-system",
  HOST: "127.0.0.1",
  PORT: {
    FIRESTORE: 8080,
    FUNCTIONS: 5001,
  },
} as const;
