import { EMULATOR } from "./constants/Emulator.constants.js";

// True inside the Emulator Suite: where a function may use the public test
// values of a provider instead of a real secret (cloud-functions-standards §7).
export const isEmulator = (): boolean =>
  process.env[EMULATOR.ENV_VAR] === EMULATOR.FLAG_ENABLED;
