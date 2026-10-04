import "@testing-library/jest-dom/vitest";

// Safety net: unit tests never reach Firebase (unit-testing-standards §5).
// Importing a module that touches the SDK gets inert instances instead of
// initializing a real app. Features still mock their own api/ functions.
vi.mock("@/shared/lib/firebase/firebaseApp", () => ({
  auth: {},
  firebaseApp: {},
  firestore: {},
  functions: {},
}));

vi.mock("@/services/firebase/firebaseApp", () => ({
  auth: {},
  firebaseApp: {},
  firestore: {},
  functions: {},
}));
