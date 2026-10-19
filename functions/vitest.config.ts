import { defineConfig } from "vitest/config";

// Function tests run in Node (unit-testing-standards §1). Tests that need
// Auth or Firestore run through `npm run test:functions` at the repository
// root, which starts the emulators with `firebase emulators:exec`. They share
// one emulator database, so test files run one after another.
export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["src/**/tests/**/*.test.ts"],
  },
});
